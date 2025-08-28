
drop extension if exists "pg_net";

create type "public"."user_role" as enum ('employee', 'driver', 'cook', 'admin');

create sequence "public"."admins_admin_id_seq";

create sequence "public"."companies_company_id_seq";

create sequence "public"."cooks_cook_id_seq";

create sequence "public"."drivers_driver_id_seq";

create sequence "public"."employees_employee_id_seq";

create sequence "public"."meals_meal_id_seq";

create sequence "public"."orders_order_id_seq";


  create table "public"."admins" (
    "admin_id" integer not null default nextval('admins_admin_id_seq'::regclass),
    "auth_id" uuid,
    "name" character varying(255) not null,
    "admin_code" character varying(50) not null,
    "email" character varying(255),
    "phone" character varying(50),
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );



  create table "public"."companies" (
    "company_id" integer not null default nextval('companies_company_id_seq'::regclass),
    "name" character varying(255) not null,
    "logo_url" text,
    "lunch_time" time without time zone not null,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."companies" enable row level security;


  create table "public"."cooks" (
    "cook_id" integer not null default nextval('cooks_cook_id_seq'::regclass),
    "auth_id" uuid not null,
    "name" character varying(255) not null,
    "phone" character varying(50),
    "email" character varying(255),
    "address_line1" character varying(255),
    "address_line2" character varying(255),
    "city" character varying(100),
    "postal_code" character varying(20),
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."cooks" enable row level security;


  create table "public"."drivers" (
    "driver_id" integer not null default nextval('drivers_driver_id_seq'::regclass),
    "name" character varying(255) not null,
    "phone" character varying(50),
    "email" character varying(255),
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "auth_id" uuid not null
      );


alter table "public"."drivers" enable row level security;


  create table "public"."employees" (
    "employee_id" integer not null default nextval('employees_employee_id_seq'::regclass),
    "auth_id" uuid,
    "company_id" integer not null,
    "name" character varying(255) not null,
    "employee_code" character varying(50) not null,
    "email" character varying(255),
    "phone" character varying(50),
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."employees" enable row level security;


  create table "public"."meals" (
    "meal_id" integer not null default nextval('meals_meal_id_seq'::regclass),
    "name" character varying(255) not null,
    "description" text,
    "price" numeric(10,2) not null,
    "is_weekly_special" boolean default false,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
      );


alter table "public"."meals" enable row level security;


  create table "public"."orders" (
    "order_id" integer not null default nextval('orders_order_id_seq'::regclass),
    "employee_id" integer not null,
    "meal_id" integer not null,
    "company_id" integer not null,
    "order_date" date not null,
    "plan_type" character varying(20) not null,
    "status" character varying(20) default 'pending'::character varying,
    "quantity" integer default 1,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "auth_id" uuid
      );


alter table "public"."orders" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null default gen_random_uuid(),
    "role" user_role not null,
    "full_name" text not null,
    "status" text default 'active'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "admin_metadata" jsonb default '{}'::jsonb
      );


alter sequence "public"."admins_admin_id_seq" owned by "public"."admins"."admin_id";

alter sequence "public"."companies_company_id_seq" owned by "public"."companies"."company_id";

alter sequence "public"."cooks_cook_id_seq" owned by "public"."cooks"."cook_id";

alter sequence "public"."drivers_driver_id_seq" owned by "public"."drivers"."driver_id";

alter sequence "public"."employees_employee_id_seq" owned by "public"."employees"."employee_id";

alter sequence "public"."meals_meal_id_seq" owned by "public"."meals"."meal_id";

alter sequence "public"."orders_order_id_seq" owned by "public"."orders"."order_id";

CREATE UNIQUE INDEX admins_auth_id_key ON public.admins USING btree (auth_id);

CREATE UNIQUE INDEX admins_pkey ON public.admins USING btree (admin_id);

CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (company_id);

CREATE UNIQUE INDEX cooks_auth_id_key ON public.cooks USING btree (auth_id);

CREATE UNIQUE INDEX cooks_pkey ON public.cooks USING btree (cook_id);

CREATE UNIQUE INDEX drivers_auth_id_key ON public.drivers USING btree (auth_id);

CREATE UNIQUE INDEX drivers_pkey ON public.drivers USING btree (driver_id);

CREATE UNIQUE INDEX employees_auth_id_key ON public.employees USING btree (auth_id);

CREATE UNIQUE INDEX employees_pkey ON public.employees USING btree (employee_id);

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);

CREATE INDEX idx_profiles_status ON public.profiles USING btree (status);

CREATE UNIQUE INDEX meals_pkey ON public.meals USING btree (meal_id);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (order_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

alter table "public"."admins" add constraint "admins_pkey" PRIMARY KEY using index "admins_pkey";

alter table "public"."companies" add constraint "companies_pkey" PRIMARY KEY using index "companies_pkey";

alter table "public"."cooks" add constraint "cooks_pkey" PRIMARY KEY using index "cooks_pkey";

alter table "public"."drivers" add constraint "drivers_pkey" PRIMARY KEY using index "drivers_pkey";

alter table "public"."employees" add constraint "employees_pkey" PRIMARY KEY using index "employees_pkey";

alter table "public"."meals" add constraint "meals_pkey" PRIMARY KEY using index "meals_pkey";

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."admins" add constraint "admins_auth_id_key" UNIQUE using index "admins_auth_id_key";

alter table "public"."cooks" add constraint "cooks_auth_id_key" UNIQUE using index "cooks_auth_id_key";

alter table "public"."cooks" add constraint "fk_auth" FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."cooks" validate constraint "fk_auth";

alter table "public"."drivers" add constraint "drivers_auth_id_key" UNIQUE using index "drivers_auth_id_key";

alter table "public"."drivers" add constraint "fk_auth" FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."drivers" validate constraint "fk_auth";

alter table "public"."employees" add constraint "employees_auth_id_key" UNIQUE using index "employees_auth_id_key";

alter table "public"."employees" add constraint "fk_company" FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE not valid;

alter table "public"."employees" validate constraint "fk_company";

alter table "public"."orders" add constraint "fk_company" FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "fk_company";

alter table "public"."orders" add constraint "fk_employee" FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "fk_employee";

alter table "public"."orders" add constraint "fk_meal" FOREIGN KEY (meal_id) REFERENCES meals(meal_id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "fk_meal";

alter table "public"."orders" add constraint "orders_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) not valid;

alter table "public"."orders" validate constraint "orders_auth_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$function$
;

grant delete on table "public"."admins" to "anon";

grant insert on table "public"."admins" to "anon";

grant references on table "public"."admins" to "anon";

grant select on table "public"."admins" to "anon";

grant trigger on table "public"."admins" to "anon";

grant truncate on table "public"."admins" to "anon";

grant update on table "public"."admins" to "anon";

grant delete on table "public"."admins" to "authenticated";

grant insert on table "public"."admins" to "authenticated";

grant references on table "public"."admins" to "authenticated";

grant select on table "public"."admins" to "authenticated";

grant trigger on table "public"."admins" to "authenticated";

grant truncate on table "public"."admins" to "authenticated";

grant update on table "public"."admins" to "authenticated";

grant delete on table "public"."admins" to "service_role";

grant insert on table "public"."admins" to "service_role";

grant references on table "public"."admins" to "service_role";

grant select on table "public"."admins" to "service_role";

grant trigger on table "public"."admins" to "service_role";

grant truncate on table "public"."admins" to "service_role";

grant update on table "public"."admins" to "service_role";

grant delete on table "public"."companies" to "anon";

grant insert on table "public"."companies" to "anon";

grant references on table "public"."companies" to "anon";

grant select on table "public"."companies" to "anon";

grant trigger on table "public"."companies" to "anon";

grant truncate on table "public"."companies" to "anon";

grant update on table "public"."companies" to "anon";

grant delete on table "public"."companies" to "authenticated";

grant insert on table "public"."companies" to "authenticated";

grant references on table "public"."companies" to "authenticated";

grant select on table "public"."companies" to "authenticated";

grant trigger on table "public"."companies" to "authenticated";

grant truncate on table "public"."companies" to "authenticated";

grant update on table "public"."companies" to "authenticated";

grant delete on table "public"."companies" to "service_role";

grant insert on table "public"."companies" to "service_role";

grant references on table "public"."companies" to "service_role";

grant select on table "public"."companies" to "service_role";

grant trigger on table "public"."companies" to "service_role";

grant truncate on table "public"."companies" to "service_role";

grant update on table "public"."companies" to "service_role";

grant delete on table "public"."cooks" to "anon";

grant insert on table "public"."cooks" to "anon";

grant references on table "public"."cooks" to "anon";

grant select on table "public"."cooks" to "anon";

grant trigger on table "public"."cooks" to "anon";

grant truncate on table "public"."cooks" to "anon";

grant update on table "public"."cooks" to "anon";

grant delete on table "public"."cooks" to "authenticated";

grant insert on table "public"."cooks" to "authenticated";

grant references on table "public"."cooks" to "authenticated";

grant select on table "public"."cooks" to "authenticated";

grant trigger on table "public"."cooks" to "authenticated";

grant truncate on table "public"."cooks" to "authenticated";

grant update on table "public"."cooks" to "authenticated";

grant delete on table "public"."cooks" to "service_role";

grant insert on table "public"."cooks" to "service_role";

grant references on table "public"."cooks" to "service_role";

grant select on table "public"."cooks" to "service_role";

grant trigger on table "public"."cooks" to "service_role";

grant truncate on table "public"."cooks" to "service_role";

grant update on table "public"."cooks" to "service_role";

grant delete on table "public"."drivers" to "anon";

grant insert on table "public"."drivers" to "anon";

grant references on table "public"."drivers" to "anon";

grant select on table "public"."drivers" to "anon";

grant trigger on table "public"."drivers" to "anon";

grant truncate on table "public"."drivers" to "anon";

grant update on table "public"."drivers" to "anon";

grant delete on table "public"."drivers" to "authenticated";

grant insert on table "public"."drivers" to "authenticated";

grant references on table "public"."drivers" to "authenticated";

grant select on table "public"."drivers" to "authenticated";

grant trigger on table "public"."drivers" to "authenticated";

grant truncate on table "public"."drivers" to "authenticated";

grant update on table "public"."drivers" to "authenticated";

grant delete on table "public"."drivers" to "service_role";

grant insert on table "public"."drivers" to "service_role";

grant references on table "public"."drivers" to "service_role";

grant select on table "public"."drivers" to "service_role";

grant trigger on table "public"."drivers" to "service_role";

grant truncate on table "public"."drivers" to "service_role";

grant update on table "public"."drivers" to "service_role";

grant delete on table "public"."employees" to "anon";

grant insert on table "public"."employees" to "anon";

grant references on table "public"."employees" to "anon";

grant select on table "public"."employees" to "anon";

grant trigger on table "public"."employees" to "anon";

grant truncate on table "public"."employees" to "anon";

grant update on table "public"."employees" to "anon";

grant delete on table "public"."employees" to "authenticated";

grant insert on table "public"."employees" to "authenticated";

grant references on table "public"."employees" to "authenticated";

grant select on table "public"."employees" to "authenticated";

grant trigger on table "public"."employees" to "authenticated";

grant truncate on table "public"."employees" to "authenticated";

grant update on table "public"."employees" to "authenticated";

grant delete on table "public"."employees" to "service_role";

grant insert on table "public"."employees" to "service_role";

grant references on table "public"."employees" to "service_role";

grant select on table "public"."employees" to "service_role";

grant trigger on table "public"."employees" to "service_role";

grant truncate on table "public"."employees" to "service_role";

grant update on table "public"."employees" to "service_role";

grant delete on table "public"."meals" to "anon";

grant insert on table "public"."meals" to "anon";

grant references on table "public"."meals" to "anon";

grant select on table "public"."meals" to "anon";

grant trigger on table "public"."meals" to "anon";

grant truncate on table "public"."meals" to "anon";

grant update on table "public"."meals" to "anon";

grant delete on table "public"."meals" to "authenticated";

grant insert on table "public"."meals" to "authenticated";

grant references on table "public"."meals" to "authenticated";

grant select on table "public"."meals" to "authenticated";

grant trigger on table "public"."meals" to "authenticated";

grant truncate on table "public"."meals" to "authenticated";

grant update on table "public"."meals" to "authenticated";

grant delete on table "public"."meals" to "service_role";

grant insert on table "public"."meals" to "service_role";

grant references on table "public"."meals" to "service_role";

grant select on table "public"."meals" to "service_role";

grant trigger on table "public"."meals" to "service_role";

grant truncate on table "public"."meals" to "service_role";

grant update on table "public"."meals" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";


  create policy "companies_select_all"
  on "public"."companies"
  as permissive
  for select
  to public
using ((auth.role() = 'admin'::text));



  create policy "companies_update_all"
  on "public"."companies"
  as permissive
  for update
  to public
using ((auth.role() = 'admin'::text));



  create policy "cooks_admin"
  on "public"."cooks"
  as permissive
  for all
  to public
using ((auth.role() = 'admin'::text));



  create policy "cooks_select_own"
  on "public"."cooks"
  as permissive
  for select
  to public
using ((auth_id = auth.uid()));



  create policy "drivers_admin"
  on "public"."drivers"
  as permissive
  for all
  to public
using ((auth.role() = 'admin'::text));



  create policy "drivers_select_own"
  on "public"."drivers"
  as permissive
  for select
  to public
using ((auth_id = auth.uid()));



  create policy "employees_admin"
  on "public"."employees"
  as permissive
  for all
  to public
using ((auth.role() = 'admin'::text));



  create policy "employees_select_own"
  on "public"."employees"
  as permissive
  for select
  to public
using ((auth_id = auth.uid()));



  create policy "employees_update_admin"
  on "public"."employees"
  as permissive
  for update
  to public
using ((auth.role() = 'admin'::text));



  create policy "meals_manage_admin"
  on "public"."meals"
  as permissive
  for all
  to public
using ((auth.role() = 'admin'::text));



  create policy "meals_select_all"
  on "public"."meals"
  as permissive
  for select
  to public
using (true);



  create policy "orders_admin"
  on "public"."orders"
  as permissive
  for all
  to public
using ((auth.role() = 'admin'::text));



  create policy "orders_select_cooks"
  on "public"."orders"
  as permissive
  for select
  to public
using ((auth.role() = 'cook'::text));



  create policy "orders_select_drivers"
  on "public"."orders"
  as permissive
  for select
  to public
using ((auth.role() = 'driver'::text));



  create policy "orders_select_own"
  on "public"."orders"
  as permissive
  for select
  to public
using ((auth_id = auth.uid()));



  create policy "orders_update_admin"
  on "public"."orders"
  as permissive
  for update
  to public
using ((auth.role() = 'admin'::text));


CREATE TRIGGER trigger_update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_cooks_updated_at BEFORE UPDATE ON public.cooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_meals_updated_at BEFORE UPDATE ON public.meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();



