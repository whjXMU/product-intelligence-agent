import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { getTypeOrmDataSourceOptions } from './database/typeorm-options';

const AppDataSource = new DataSource(getTypeOrmDataSourceOptions());

export default AppDataSource;
