import { IsBoolean, IsNotEmpty, IsNumber, IsInt, Min } from 'class-validator';
import { JsendBaseConfigRequestDto } from './jsend-base-config.request.dto';

export class SellItemRequestDto extends JsendBaseConfigRequestDto {
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(1)
  quantity: number;
}