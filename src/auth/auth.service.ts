import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

import * as bcryptjs from 'bcryptjs';

/*import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';*/
import { CreateUserDto,LoginDto,UpdateAuthDto,RegisterUserDto } from './dto';
import { User } from './entities/user.entity';

import { JwtPayload } from './interfaces/jwt-payload';
import { LoginResponse } from './interfaces/login-response';


@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) 
    private userModel:Model<User>,
    private jwtService:JwtService,
  ){}

  //create(createUserDto: CreateUserDto) {
  /*create(createUserDto: CreateUserDto):Promise<User> {
    console.log(createUserDto);
    //return 'This action adds a new auth';
    const newUser=new this.userModel(createUserDto);
    return newUser.save();
  }*/

  async create(createUserDto: CreateUserDto):Promise<User> {
    try {
      //1- Encriptar la contraseña
      const {password,...userData}=createUserDto;
      //2- Guardar el usuario
      const newUser=new this.userModel({
        password:bcryptjs.hashSync(password,10),
        ...userData
      });
      //return await newUser.save();
      await newUser.save();
      const {password:_,...user }=newUser.toJSON();
      
      return user;
      //3- Generar el JWT
    } catch (error) {
      //console.log(error.code);
      if(error.code===11000){
        throw new BadRequestException(`${ createUserDto.email} already exists!`);
      }
      throw new InternalServerErrorException('Something terrible happen!!!');
    }   
  }

  async register(registerUserDto: RegisterUserDto):Promise<LoginResponse>{
    const user=await this.create(registerUserDto);    
    console.log(user);
    return {
      user:user,
      token: this.getJwtToken({ id:user._id})
    
    }
  }

  //async login(loginDto:LoginDto){
  async login(loginDto:LoginDto):Promise<LoginResponse>{
    console.log({loginDto});
    const {email,password}=loginDto;
    //const user =await this.userModel.findOne({ email:email });
    const user =await this.userModel.findOne({ email });
    if(!user){
      throw new UnauthorizedException('Not valid credentials - email');
    }
    if(user.password!==undefined){
      if(!bcryptjs.compareSync( password, user.password)){
        throw new UnauthorizedException('Not valid credentials - password');
      }
    }

    const {password:_,...rest}=user.toJSON();

    return{
      user:rest,
      token:this.getJwtToken({id:user.id}),
    }
   
  }

  //findAll() {
  findAll():Promise<User[]>
   {
    //return `This action returns all auth`;
    return this.userModel.find();
  }

  async findUserById(id:string){
    const user=await this.userModel.findById(id); 
    if(user!=null)  {
      const { password, ...rest } = user.toJSON();
      return rest;
    }    
    return user;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  getJwtToken(payload:JwtPayload){
    const token=this.jwtService.sign(payload);
    return token;
  }
  
}
