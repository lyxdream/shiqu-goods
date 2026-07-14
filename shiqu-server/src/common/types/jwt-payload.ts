export interface JwtUserPayload {
  sub: number;
  username: string;
  type: 'user';
  jti: string;
}

export interface JwtAdminPayload {
  sub: number;
  username: string;
  type: 'admin';
}

export type JwtPayload = JwtUserPayload | JwtAdminPayload;
