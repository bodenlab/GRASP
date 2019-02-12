CREATE DATABASE grasp_db;

CREATE ROLE web_role WITH NOCREATEDB NOCREATEROLE NOSUPERUSER;

CREATE USER web_user WITH ROLE web_role;

ALTER USER web_user WITH ENCRYPTED PASSWORD 'strongpassword';

CREATE EXTENSION pgcrypto;

\c grasp_db;

CREATE EXTENSION pgcrypto;

CREATE SCHEMA web;

CREATE SCHEMA util;

GRANT ALL PRIVILEGES ON SCHEMA web TO web_user;

GRANT ALL PRIVILEGES ON SCHEMA util TO web_user;

SET ROLE web_user;

CREATE TABLE IF NOT EXISTS util.ncbi2taxa
(
  id VARCHAR(24) PRIMARY KEY NOT NULL,
  taxa_id int
);

CREATE UNIQUE INDEX IF NOT EXISTS ncbi2taxa_id_uindex ON util.ncbi2taxa (id);

CREATE TABLE IF NOT EXISTS util.uniprot2taxa
(
  id VARCHAR(24) PRIMARY KEY NOT NULL,
  taxa_id int
);

CREATE UNIQUE INDEX uniprot2taxa_id_uindex ON util.uniprot2taxa (id);

CREATE TABLE IF NOT EXISTS util.taxa
(
  id int PRIMARY KEY NOT NULL,
  t_superkingdom varchar(150),
  t_kingdom varchar(150),
  t_phylum varchar(150),
  t_class varchar(150),
  t_order varchar(150),
  t_family varchar(150),
  t_genus varchar(150),
  t_species varchar(150)

);

CREATE UNIQUE INDEX taxa_id_uindex ON util.taxa (id);

CREATE SEQUENCE IF NOT EXISTS web.groups_id_seq
  maxvalue 2147483647;

CREATE SEQUENCE IF NOT EXISTS web.users_id_seq
  maxvalue 2147483647;

CREATE SEQUENCE IF NOT EXISTS web.share_groups_id_seq
  maxvalue 2147483647;

CREATE SEQUENCE IF NOT EXISTS web.reconstructions_id_seq
  maxvalue 2147483647;

CREATE SEQUENCE IF NOT EXISTS web.share_users_id_seq
  maxvalue 2147483647;

CREATE SEQUENCE IF NOT EXISTS web.groups_users_id_seq
  maxvalue 2147483647;

create table if not exists web.users
(
  id         serial       not null
    constraint users_pkey
    primary key,
  username   varchar(100) not null
    constraint users_username_key
    unique,
  password   varchar(255) not null,
  email      varchar(255)
    constraint users_email_key
    unique,
  registered boolean,
  updated_at timestamp with time zone default timezone('AEST' :: text, now())
);



create table if not exists web.reconstructions
(
  id                 serial not null
    constraint reconstructions_pkey
    primary key,
  owner_id           integer
    constraint reconstructions_owner_id_fkey
    references web.users,
  ancestor           varchar,
  inference_type     varchar(255),
  joint_inferences   varchar,
  label              varchar(255),
  model              varchar(255),
  msa                varchar,
  node               varchar(255),
  num_threads        smallint,
  reconstructed_tree varchar,
  sequences          varchar,
  tree               varchar,
  updated_at         timestamp with time zone default timezone('AEST' :: text, now())
);




CREATE TABLE IF NOT EXISTS web.sequences
(
  id serial not null
    constraint sequences_pkey
    primary key,
  r_id serial not null
    constraint sequences_reconstructions_id_key
    references web.reconstructions,
  node_label varchar not null,
  seq varchar not null,
  s_type integer default 1,
  updated_at timestamp with time zone default timezone('AEST'::text, now())
)
;


CREATE UNIQUE INDEX IF NOT EXISTS sequences_id_uindex
  on web.sequences (id)
;


create or replace function web.updated_at_reset() returns trigger
language plpgsql
as $$
BEGIN
  NEW.updated_at = timezone('AEST' :: text, now());
  RETURN NEW;
END;
$$
;

create trigger updated_at_reset
  before update
  on web.sequences
  for each row
execute procedure web.updated_at_reset()
;



CREATE TABLE IF NOT EXISTS web.inferences
(
  id serial not null
    constraint inferences_pkey
    primary key,
  r_id serial not null
    constraint inferences_reconstructions_id_key
    references web.reconstructions,
  node_label varchar not null,
  inference varchar not null,
  updated_at timestamp with time zone default timezone('AEST'::text, now())
)
;

CREATE UNIQUE INDEX IF NOT EXISTS inferences_id_uindex
  on web.inferences (id)
;


create or replace function web.updated_at_reset() returns trigger
language plpgsql
as $$
BEGIN
  NEW.updated_at = timezone('AEST' :: text, now());
  RETURN NEW;
END;
$$
;


create trigger updated_at_reset
  before update
  on web.inferences
  for each row
execute procedure web.updated_at_reset()
;


create table if not exists web.groups
(
  id         serial       not null
    constraint groups_pkey
    primary key,
  owner_id   integer      not null
    constraint groups_owner_id_fkey
    references web.users,
  name       varchar(255) not null,
  updated_at timestamp with time zone default timezone('AEST' :: text, now())
);

create table if not exists web.share_groups
(
  id         serial  not null
    constraint share_groups_pkey
    primary key,
  g_id       integer not null
    constraint share_groups_g_id_fkey
    references web.groups,
  r_id       integer not null
    constraint share_groups_r_id_fkey
    references web.reconstructions,
  updated_at timestamp with time zone default timezone('AEST' :: text, now()),
  constraint share_groups_g_id_r_id_key
  unique (g_id, r_id)
);


create table if not exists web.share_users
(
  id         serial  not null
    constraint share_users_pkey
    primary key,
  r_id       integer not null
    constraint share_users_r_id_fkey
    references web.reconstructions,
  u_id       integer not null
    constraint share_users_u_id_fkey
    references web.users,
  updated_at timestamp with time zone default timezone('AEST' :: text, now()),
  constraint share_users_r_id_u_id_key
  unique (r_id, u_id)
);


create table if not exists web.groups_users
(
  id         serial  not null
    constraint groups_users_pkey
    primary key,
  g_id       integer not null
    constraint groups_users_g_id_fkey
    references web.groups,
  u_id       integer not null
    constraint groups_users_u_id_fkey
    references web.users,
  updated_at timestamp with time zone default timezone('AEST' :: text, now()),
  constraint groups_users_g_id_u_id_key
  unique (g_id, u_id)
);


create trigger updated_at_reset
  before update
  on web.groups
  for each row
execute procedure web.updated_at_reset();

create trigger updated_at_reset
  before update
  on web.users
  for each row
execute procedure web.updated_at_reset();

create trigger updated_at_reset
  before update
  on web.share_groups
  for each row
execute procedure web.updated_at_reset();

create trigger updated_at_reset
  before update
  on web.reconstructions
  for each row
execute procedure web.updated_at_reset();

create trigger updated_at_reset
  before update
  on web.share_users
  for each row
execute procedure web.updated_at_reset();

create trigger updated_at_reset
  before update
  on web.groups_users
  for each row
execute procedure web.updated_at_reset();
