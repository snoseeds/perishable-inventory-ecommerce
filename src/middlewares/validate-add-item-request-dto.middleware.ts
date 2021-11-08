import { Injectable, NestMiddleware, Res } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JSendResponseDto } from '../domain/dto/jsend-response.dto';
import { AddItemRequestDto } from '../domain/dto/add-item.request.dto';
import { Validator } from 'class-validator';
  
@Injectable()
export class ValidateAddItemRequestDtoMiddleware implements NestMiddleware {
  constructor(
  ){}
  readonly validator = new Validator();
  
  async use(req: Request, @Res() res: Response, next: NextFunction) {
    try {
      const newAddItem = new AddItemRequestDto();
      Object
        .entries(req.body)
        .forEach(([key, value]) => {
          newAddItem[key] = value
        });

      // Mimicking the use of @Body to validate additemrequestdto
      const errors = await this.validator.validate(newAddItem);
      if (errors.length > 0) {
        return res.status(400).send(new JSendResponseDto("failed", 400, "Bad request, details are in data", errors.map(err => {
          return {
            propertyName: err.property,
            errors: err.constraints
          }
        })));
      }      
      req.body.useConsistentJsendResp = newAddItem.useConsistentJsendResp;  
      return next()
    } catch(err) {
      return next(err);
    }
  }
}
