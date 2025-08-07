import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
//import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private jwtService:JwtService,
    private authService:AuthService,
    
  ){}

  async canActivate(
    context: ExecutionContext,
  //): boolean | Promise<boolean> | Observable<boolean> {
  ): Promise<boolean>{

    const request=context.switchToHttp().getRequest();
    console.log({request});
    const token = this.extractTokenFromHeader(request);
    console.log({token});
     if (!token) {
      throw new UnauthorizedException('there is no bearer token');
    }
    
    try{
      const payload = await this.jwtService.verifyAsync(
          token,
          {
            //secret: jwtConstants.secret
            secret: process.env.JWT_SEED
          }
        );

        console.log({payload});
        // 💡 We're assigning the payload to the request object here
        // so that we can access it in our route handlers
        const user= await this.authService.findUserById(payload.id);
        if (!user) throw new UnauthorizedException('User does not exists');
        if (!user.isActive) throw new UnauthorizedException('User is not active');

        request['user'] = payload;
    }catch(error){
      throw new UnauthorizedException();
    }
    
    return Promise.resolve(true);
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

}
