select * from customer where cor_id = $1 and LOWER(service) = LOWER($2);