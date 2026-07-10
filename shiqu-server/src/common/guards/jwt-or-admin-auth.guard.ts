import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOrAdminAuthGuard extends AuthGuard(['jwt', 'admin-jwt']) {}
