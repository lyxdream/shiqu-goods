import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { throwNotFound } from 'src/common/exceptions/biz-error.util';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  findAll(userId: number) {
    return this.addressRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(userId: number, dto: CreateAddressDto) {
    const address = this.addressRepository.create({ ...dto, userId });
    return this.addressRepository.save(address);
  }

  async update(userId: number, id: number, dto: UpdateAddressDto) {
    const address = await this.findOwned(userId, id);
    Object.assign(address, dto);
    return this.addressRepository.save(address);
  }

  async remove(userId: number, id: number) {
    const address = await this.findOwned(userId, id);
    await this.addressRepository.remove(address);
    return null;
  }

  async findOwned(userId: number, id: number, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(Address)
      : this.addressRepository;
    const address = await repo.findOne({
      where: { id, userId },
    });
    if (!address) {
      throwNotFound('地址不存在');
    }
    return address;
  }
}
