export class EmailVO {
  private constructor(private readonly email: string) {
    const rfc5322 =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!rfc5322.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
  }

  static of(email: string): EmailVO {
    return new EmailVO(email.toLowerCase());
  }

  get value(): string {
    return this.email;
  }
}
