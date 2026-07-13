import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { fromCents } from 'src/common/utils/money.util';
import { ProductStatusEnum } from 'src/common/enums';
import { Product } from 'src/modules/product/entities/product.entity';
import { Order } from 'src/modules/order/entities/order.entity';
import { AiChatDto } from './dto/ai-chat.dto';
import { AiParseDocumentDto } from './dto/ai-parse-document.dto';

type ProductContext = {
  id: number;
  productNo: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  status: string;
};

/** 进程内缓存，TTL 60 秒，避免每次 AI 请求都全表扫描 */
type ProductsCache = { data: ProductContext[]; cachedAt: number };

@Injectable()
export class AiService {
  private _productsCache: ProductsCache | null = null;
  private readonly PRODUCTS_CACHE_TTL = 60_000; // 60 秒

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  private get baseUrl() {
    return this.configService.get<string>('ai.serviceUrl');
  }

  private async getOnSaleProducts(): Promise<ProductContext[]> {
    const now = Date.now();
    if (
      this._productsCache &&
      now - this._productsCache.cachedAt < this.PRODUCTS_CACHE_TTL
    ) {
      return this._productsCache.data;
    }
    const rows = await this.productRepository.find({
      where: { status: ProductStatusEnum.ON_SALE },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const data = rows.map((p) => ({
      id: p.id,
      productNo: p.productNo,
      name: p.name,
      price: fromCents(p.price),
      stock: p.stock,
      description: p.description,
      status: p.status,
    }));
    this._productsCache = { data, cachedAt: now };
    return data;
  }

  async chat(userId: number, body: AiChatDto) {
    const scene = body.scene || this.inferScene(body);
    const context = await this.buildContext(userId, body);

    return this.forward(`${this.baseUrl}/chat`, {
      message: body.message,
      sessionId: body.sessionId,
      scene,
      productId: body.productId,
      orderId: body.orderId,
      context,
    });
  }

  async parseDocument(body: AiParseDocumentDto) {
    return this.forward(`${this.baseUrl}/document/parse`, body);
  }

  private inferScene(body: AiChatDto): string {
    if (body.productId) return 'product_qa';
    if (body.orderId) return 'order_help';
    return 'assistant';
  }

  private async buildContext(userId: number, body: AiChatDto) {
    const context: Record<string, unknown> = {};
    const scene = body.scene || this.inferScene(body);

    if (
      scene === 'product_recommend' ||
      scene === 'assistant' ||
      scene === 'purchase_list'
    ) {
      context.products = await this.getOnSaleProducts();
    }

    if (body.productId) {
      const product = await this.productRepository.findOne({
        where: { id: body.productId },
      });
      if (product) {
        context.product = {
          id: product.id,
          productNo: product.productNo,
          name: product.name,
          price: fromCents(product.price),
          stock: product.stock,
          description: product.description,
          status: product.status,
          image: product.image,
        };
      }
    }

    if (body.orderId) {
      const order = await this.orderRepository.findOne({
        where: { id: body.orderId, userId },
        relations: ['items'],
      });
      if (order) {
        context.order = {
          id: order.id,
          orderNo: order.orderNo,
          status: order.status,
          totalAmount: fromCents(order.totalAmount),
          contactName: order.contactName,
          pickupAddress: order.pickupAddress,
          createdAt: order.createdAt,
          items: (order.items || []).map((item) => ({
            productId: item.productId,
            productNo: item.productNo,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: fromCents(item.unitPrice),
          })),
        };
      }
    }

    return context;
  }

  private async forward(url: string, body: unknown): Promise<unknown> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<unknown>(url, body),
      );
      return data;
    } catch (err: unknown) {
      const axiosError = err as AxiosError;
      if (
        axiosError.code === 'ECONNREFUSED' ||
        axiosError.code === 'ETIMEDOUT'
      ) {
        throw new ServiceUnavailableException('AI 服务暂不可用');
      }
      throw new BadGatewayException(
        (axiosError.response?.data as { message?: string })?.message ||
          'AI 服务调用失败',
      );
    }
  }
}
