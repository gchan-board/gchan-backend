### Migrations

Cria tabela pra registro de ip

    CREATE TABLE post_logs (id SERIAL PRIMARY KEY, table_pk INT NOT NULL, table_name VARCHAR(255) NOT NULL, action VARCHAR(255) NOT NULL, x_real_ip VARCHAR(255), remoteaddress VARCHAR(255), x_forwarded_for TEXT, score VARCHAR(255));
    ALTER TABLE post_logs ADD CONSTRAINT unique_id UNIQUE (table_pk, table_name);

Adiciona horário nas postagens

    ALTER TABLE messages ALTER COLUMN created TYPE TIMESTAMP;
    ALTER TABLE messages ALTER COLUMN created SET DEFAULT NOW();

Adiciona horário nas replies

    ALTER TABLE replies ALTER COLUMN created TYPE TIMESTAMP;
    ALTER TABLE replies ALTER COLUMN created SET DEFAULT NOW();
