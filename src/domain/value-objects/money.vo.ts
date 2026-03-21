export class MoneyVO {
  private constructor(private readonly cents: number) {
    if (!Number.isInteger(cents)) {
      throw new Error('Money must be an integer (cents)');
    }
  }

  static of(cents: number): MoneyVO {
    return new MoneyVO(cents);
  }

  get value(): number {
    return this.cents;
  }

  add(other: MoneyVO): MoneyVO {
    return new MoneyVO(this.cents + other.cents);
  }

  subtract(other: MoneyVO): MoneyVO {
    return new MoneyVO(this.cents - other.cents);
  }

  isGreaterThan(other: MoneyVO): boolean {
    return this.cents > other.cents;
  }

  equals(other: MoneyVO): boolean {
    return this.cents === other.cents;
  }
}
