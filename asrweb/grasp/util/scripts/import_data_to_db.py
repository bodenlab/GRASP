#!/usr/bin/python
import psycopg2
from config import config
import csv

"""
pdb.accession2taxid_04092018

accession       accession.version       taxid   gi
2BOP_A  2BOP_A  337052  494744
2BOP_B  2BOP_B  32630   494745

prot.accession2taxid_04092018
accession       accession.version       taxid   gi
P26567  P26567.2        4577    1168978
P12208  P12208.1        3197    116525

lineages
tax_id,superkingdom,phylum,class,order,family,genus,species,cohort,forma,infraclass,infraorder,kingdom,no rank,no rank1,no rank10,no rank11,no rank12,no rank13,no rank14,no rank15,no rank16,no rank17,no rank18,no rank19,no rank2,no rank20,no rank21,no rank3,no rank4,no rank5,no rank6,no rank7,no rank8,no rank9,parvorder,species group,species subgroup,species1,subclass,subfamily,subgenus,subkingdom,suborder,subphylum,subspecies,subtribe,superclass,superfamily,superfamily1,superorder,superphylum,tribe,varietas
1,,,,,,,,,,,,,root,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,

want: tax_id,superkingdom,phylum,class,order,family,genus,species,cohort,forma,infraclass,infraorder,kingdom

"""


def connect():
    """ Connect to the PostgreSQL database server """
    conn = None
    try:
        # read connection parameters
        params = config()

        # connect to the PostgreSQL server
        print('Connecting to the PostgreSQL database...')
        conn = psycopg2.connect(**params)

        # create a cursor
        cur = conn.cursor()

        # execute a statement
        print('PostgreSQL database version:')
        parse_taxa_file('../resources/lineages-2018-06-13.csv', cur)

        # display the PostgreSQL database server version

        # close the communication with the PostgreSQL
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.commit()
            conn.close()
            print('Database connection closed.')


def parse_taxa_file(filename, cur):
    with open(filename,'r') as csvin:
        csvin = csv.reader(csvin)
        row_count = 0
        for row in csvin:
            for i in range(0, len(row)):
                row[i] = row[i].replace("'", '"')
            if row_count > 0:
                cur.execute("INSERT INTO util.taxa(id,superkingdom,phylum," \
                            "class_t,order_t,family_t,genus," \
                            "species,cohort,forma,infraclass,infraorder,"\
                            "kingdom) VALUES({0},'{1}','{2}','{3}', " \
                                                            "'{4}','{5}', "\
                            "'{6}','{7}','{8}','{9}','{10}','{11}','{12}'"
                            ");".format(row[0], row[1], row[2], row[3],
                                          row[4], row[5], row[6], row[7],
                                        row[8], row[9], row[10], row[11],
                                        row[12]))
            row_count += 1
    print('Executed: ', row_count, ' rows.')


if __name__ == '__main__':
    connect()