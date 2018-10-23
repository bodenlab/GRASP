CREATE TABLE util.ncbi2taxa
(
  id VARCHAR(24) PRIMARY KEY NOT NULL,
  taxa_id int
);
CREATE UNIQUE INDEX ncbi2taxa_id_uindex ON util.ncbi2taxa (id);

CREATE TABLE util.uniprot2taxa
(
  id VARCHAR(24) PRIMARY KEY NOT NULL,
  taxa_id int
);
CREATE UNIQUE INDEX uniprot2taxa_id_uindex ON util.uniprot2taxa (id);

CREATE TABLE util.taxa
(
  id int PRIMARY KEY NOT NULL,
  superkingdom varchar(150),
  phylum varchar(150),
  class_t varchar(150),
  order_t varchar(150),
  family_t varchar(150),
  genus varchar(150),
  species varchar(150),
  cohort varchar(150),
  forma varchar(150),
  infraclass varchar(150),
  infraorder varchar(150),
  kingdom varchar(150)
);
CREATE UNIQUE INDEX taxa_id_uindex ON util.taxa (id);

ALTER SCHEMA util OWNER TO web;
ALTER TABLE uniprot2taxa OWNER TO web;
ALTER TABLE ncbi2taxa OWNER TO web;
ALTER TABLE taxa OWNER TO web;

create sequence web.groups_id_seq
  maxvalue 2147483647;

create sequence web.users_id_seq
  maxvalue 2147483647;

create sequence web.share_groups_id_seq
  maxvalue 2147483647;

create sequence web.reconstructions_id_seq
  maxvalue 2147483647;

create sequence web.share_users_id_seq
  maxvalue 2147483647;

create sequence web.groups_users_id_seq
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


create table web.sequences
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
alter table web.sequences owner to web
;

create unique index sequences_id_uindex
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

alter function web.updated_at_reset() owner to web
;

create trigger updated_at_reset
  before update
  on web.sequences
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


create function web.updated_at_reset()
  returns trigger
language plpgsql
as $$
BEGIN
  NEW.updated_at = timezone('AEST' :: text, now());
  RETURN NEW;
END;
$$;


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
