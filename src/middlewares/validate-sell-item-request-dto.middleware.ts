import { Injectable, NestMiddleware, Res } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JSendResponseDto } from '../domain/dto/jsend-response.dto';
import { SellItemRequestDto } from '../domain/dto/sell-item.request.dto';
import { Validator } from 'class-validator';
  
@Injectable()
export class ValidateSellItemRequestDtoMiddleware implements NestMiddleware {
  constructor(
  ){}
  readonly validator = new Validator();
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      const newSellItem = new SellItemRequestDto();
      Object
        .entries(req.body)
        .forEach(([key, value]) => {
          newSellItem[key] = value
        });

      // Mimicking the use of @Body to validate sellitemrequestdto
      const errors = await this.validator.validate(newSellItem);
      if (errors.length > 0) {
        return res.status(400).send(new JSendResponseDto("failed", 400, "Bad request, details are in data", errors.map(err => {
          return {
            propertyName: err.property,
            errors: err.constraints
          }
        })));
      }      
      req.body.useConsistentJsendResp = newSellItem.useConsistentJsendResp;  
      return next()
    } catch(err) {
      return next(err);
    }
  }
}
