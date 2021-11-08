export class GetItemQuantityResponseDto<T> {
  constructor(
    public quantity: number,
    public validTill?: number
  ) {
  }
}