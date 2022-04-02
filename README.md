## Configuração do postgresql no local

Dependendo da configuração no local, o erro

    8:03:13 PM dev.1 |  Error: getaddrinfo EAI_AGAIN guits
    8:03:13 PM dev.1 |      at GetAddrInfoReqWrap.onlookup [as oncomplete] (node:dns:69:26) {
    8:03:13 PM dev.1 |    errno: -3001,
    8:03:13 PM dev.1 |    code: 'EAI_AGAIN',
    8:03:13 PM dev.1 |    syscall: 'getaddrinfo',
    8:03:13 PM dev.1 |    hostname: 'guits'
    8:03:13 PM dev.1 |  }

significa que a string de conexão do psql está buscando um host chamado "guits", mas está tendo erro em resolvê-lo.

Isso é porque a constante DATABASE\_URL \(ver arquivo example.env\) está configurada como postgres://guits .

No ubuntu, se resolve adicionando uma linha

> 127.0.0.1 guits

no arquivo /etc/hosts .

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

Adiciona flag DELETED nas messages

    ALTER TABLE messages ADD COLUMN deleted boolean DEFAULT false;
