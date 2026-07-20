import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { throwBusiness, throwNotFound } from 'src/common/exceptions/biz-error.util';
import { fromCents, mapProductToApi } from 'src/common/utils/money.util';
import { ProductStatusEnum, AiSceneEnum } from 'src/common/enums';
import { Product } from 'src/modules/product/entities/product.entity';
import { ProductService } from 'src/modules/product/product.service';
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
    private readonly productService: ProductService,
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
    const scene = this.resolveScene(body);
    const context = await this.buildContext(userId, body, scene);

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

  private resolveScene(body: AiChatDto): AiSceneEnum {
    return body.scene ?? this.inferScene(body);
  }

  private inferScene(body: AiChatDto): AiSceneEnum {
    if (body.productId) return AiSceneEnum.PRODUCT_QA;
    if (body.orderId) return AiSceneEnum.ORDER_HELP;
    return AiSceneEnum.ASSISTANT;
  }

  private async buildContext(
    userId: number,
    body: AiChatDto,
    scene: AiSceneEnum,
  ) {
    const context: Record<string, unknown> = {};

    if (
      scene === AiSceneEnum.PRODUCT_RECOMMEND ||
      scene === AiSceneEnum.ASSISTANT ||
      scene === AiSceneEnum.PURCHASE_LIST
    ) {
      context.products = await this.getOnSaleProducts();
    }

    if (body.productId) {
      const product = await this.productService.findVisibleForCustomer(
        body.productId,
      );
      if (product) {
        const mapped = mapProductToApi(product);
        context.product = {
          id: mapped.id,
          productNo: mapped.productNo,
          name: mapped.name,
          price: mapped.price,
          stock: mapped.stock,
          description: mapped.description,
          image: mapped.image,
        };
      } else if (
        scene === AiSceneEnum.PRODUCT_QA ||
        scene === AiSceneEnum.GRASS_COPY
      ) {
        throwNotFound('商品不存在或已下架');
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

  private get internalSecret(): string {
    return this.configService.get<string>('ai.internalSecret') || '';
  }

  private async forward(url: string, body: unknown): Promise<unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    headers['x-internal-token'] = this.internalSecret;
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<unknown>(url, body, { headers }),
      );
      return data;
    } catch (err: unknown) {
      const axiosError = err as AxiosError;
      if (
        axiosError.code === 'ECONNREFUSED' ||
        axiosError.code === 'ETIMEDOUT'
      ) {
        throwBusiness('AI 服务暂不可用');
      }
      throwBusiness(
        (axiosError.response?.data as { message?: string })?.message ||
          'AI 服务调用失败',
      );
    }
  }
}
