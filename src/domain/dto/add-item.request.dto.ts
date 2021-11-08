import { IsNotEmpty, IsNumber, IsInt, Min } from 'class-validator';
import { JsendBaseConfigRequestDto } from './jsend-base-config.request.dto';

export class AddItemRequestDto extends JsendBaseConfigRequestDto {
  @IsNotEmpty()
  @IsNumber()
  expiry: number;

  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(1)
  quantity: number;
}