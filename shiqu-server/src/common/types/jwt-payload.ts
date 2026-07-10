export interface JwtUserPayload {
  sub: number;
  username: string;
  type: 'user';
}

export interface JwtAdminPayload {
  sub: number;
  username: string;
  type: 'admin';
}

export type JwtPayload = JwtUserPayload | JwtAdminPayload;
