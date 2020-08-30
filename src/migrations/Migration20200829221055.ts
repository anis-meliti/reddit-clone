import { Migration } from '@mikro-orm/migrations';

export class Migration20200829221055 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" drop column "title";');
  }

}
