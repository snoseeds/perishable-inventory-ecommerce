import { configService } from '../config/config.service';
import { join } from 'path';
import fs = require('fs');
import { ConnectionOptions, createConnection } from 'typeorm';

let typeOrmOptionsJSON: string;
if (process.env.MODE != 'PROD') {
  typeOrmOptionsJSON = JSON.stringify(configService.getTypeOrmConfig(), null, 2);
} else {
  const databaseUrl: string = process.env.DATABASE_URL;
  const typeOrmOptions: ConnectionOptions = {
      type: "postgres",
      url: databaseUrl,
      synchronize: true,
      entities: [join(__dirname, '../domain/model', '*.entity.{ts,js}')],

      migrationsTableName: 'migration',

      migrations: ['src/migration/*.ts'],

      cli: {
        migrationsDir: 'src/migration',
      },
      ssl: { rejectUnauthorized: false }
  };
  const connection = createConnection(typeOrmOptions);
  typeOrmOptionsJSON = JSON.stringify(typeOrmOptions, null, 2);
}

fs.writeFileSync('ormconfig.json', typeOrmOptionsJSON);