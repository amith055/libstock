
--Admin Table
-- DROP TABLE IF EXISTS public.libadmin;
CREATE TABLE IF NOT EXISTS public.libadmin
(
    adminid integer NOT NULL,
    afname character varying(45) COLLATE pg_catalog."default",
    amname character varying(45) COLLATE pg_catalog."default",
    alname character varying(45) COLLATE pg_catalog."default",
    adminpass character varying(45) COLLATE pg_catalog."default",
    CONSTRAINT admin_pkey PRIMARY KEY (adminid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.libadmin
    OWNER to postgres;


--Book List Table
CREATE TABLE IF NOT EXISTS public.libbooks
(
    bookid character varying(20) COLLATE pg_catalog."default" NOT NULL,
    bookname character varying(45) COLLATE pg_catalog."default",
    rackno integer,
    avail boolean,
    CONSTRAINT books_pkey PRIMARY KEY (bookid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.libbooks
    OWNER to postgres;


--Issued Books List table
CREATE TABLE IF NOT EXISTS public.libissuedbooks
(
    bookid character varying(20) COLLATE pg_catalog."default" NOT NULL,
    bookname character varying(45) COLLATE pg_catalog."default",
    rackno integer,
    stdid integer,
    issuedate timestamp without time zone,
    duedate timestamp without time zone,
    fname character varying(45) COLLATE pg_catalog."default",
    CONSTRAINT issuedbooks_pkey PRIMARY KEY (bookid),
    CONSTRAINT fk_books FOREIGN KEY (bookid)
        REFERENCES public.libbooks (bookid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_student FOREIGN KEY (stdid)
        REFERENCES public.libstudent (stdid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.libissuedbooks
    OWNER to postgres;


--Staff List Table

CREATE TABLE IF NOT EXISTS public.libstaff
(
    staffid integer NOT NULL,
    sfname character varying(45) COLLATE pg_catalog."default",
    smname character varying(45) COLLATE pg_catalog."default",
    slname character varying(45) COLLATE pg_catalog."default",
    sdept character varying(45) COLLATE pg_catalog."default",
    staffpass character varying(45) COLLATE pg_catalog."default",
    CONSTRAINT pk_staffid PRIMARY KEY (staffid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.libstaff
    OWNER to postgres;



--Student Table
CREATE TABLE IF NOT EXISTS public.libstudent
(
    stdid integer NOT NULL,
    fname character varying(45) COLLATE pg_catalog."default",
    mname character varying(45) COLLATE pg_catalog."default",
    lname character varying(45) COLLATE pg_catalog."default",
    usn character varying(10) COLLATE pg_catalog."default",
    dept character varying(45) COLLATE pg_catalog."default",
    stdpass character varying(45) COLLATE pg_catalog."default",
    CONSTRAINT pk_stdid PRIMARY KEY (stdid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.libstudent
    OWNER to postgres;



--Verified Book List Table
CREATE TABLE IF NOT EXISTS public.libverifiedbooks
(
    bookid character varying(45) COLLATE pg_catalog."default" NOT NULL,
    rackno integer,
    staff character varying(45) COLLATE pg_catalog."default",
    CONSTRAINT verifiedbooks_pkey PRIMARY KEY (bookid),
    CONSTRAINT pk_bookid FOREIGN KEY (bookid)
        REFERENCES public.libbooks (bookid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.libverifiedbooks
    OWNER to postgres;