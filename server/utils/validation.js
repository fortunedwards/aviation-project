const { z } = require('zod');

exports.registerSchema = z.object({
    // Required personal info
    surname: z.string().min(2, "Surname is too short").max(50).trim(),
    other_names: z.string().min(2, "Names are too short").trim(),
    email: z.string().email("Invalid email address").toLowerCase(),
    dob: z.string().or(z.date()),
    sex: z.enum(['Male', 'Female', 'Other', 'prefer_not']),
    place_of_birth: z.string().min(2, "Place of birth is required").trim(),
    state_of_origin: z.string().min(2, "State of origin is required").trim(),
    nationality: z.string().min(2, "Nationality is required").trim(),
    address: z.string().min(5, "Residential address is required").trim(),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),

    // Course selection
    selectedCourse: z.string().min(1, "Course selection is required"),

    // Required next of kin
    nok_name: z.string().min(2, "Next of Kin name required").trim(),
    nok_phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid NOK phone number"),
    nok_relation: z.string().min(2, "Relationship required"),

    // Optional fields
    org_pos: z.string().optional(),
    education: z.string().optional(),
    technical: z.string().optional(),
    qualifications: z.string().optional(),
    experience: z.string().optional(),

    // Payment reference
    payment_ref: z.string().min(1, "Payment reference is required")
});