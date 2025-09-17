export interface CreateUserDTO {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  password: string;
  dob: string;
  bvn: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  nokName?: string;
  nokPhone?: string;
  nokEmail?: string;
  nokRelationship?: string;
}
