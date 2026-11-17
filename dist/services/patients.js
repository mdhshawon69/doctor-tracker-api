import { Types } from "mongoose";
import { connectToDatabase } from "../db.js";
import { buildPagination, HttpError } from "../lib/http.js";
import { rangeStart } from "../lib/date.js";
import { buildSearchFilter } from "../lib/search.js";
import { Doctor } from "../models/doctor.js";
import { Patient } from "../models/patient.js";
export async function listPatients(query) {
    await connectToDatabase();
    const filter = {};
    const start = rangeStart(query.range);
    if (query.q) {
        const search = buildSearchFilter(query.q, ["name", "email", "phone"]);
        if (search) {
            Object.assign(filter, search);
        }
    }
    if (query.doctorId) {
        if (!Types.ObjectId.isValid(query.doctorId)) {
            throw new HttpError(400, "Choose a valid doctor.");
        }
        filter.doctorId = new Types.ObjectId(query.doctorId);
    }
    if (query.condition) {
        filter.condition = query.condition;
    }
    if (start) {
        filter.createdAt = { $gte: start };
    }
    const skip = (query.page - 1) * query.limit;
    const [patients, total] = await Promise.all([
        Patient.find(filter)
            .select("name age gender condition phone email doctorId createdAt")
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(query.limit)
            .lean()
            .exec(),
        Patient.countDocuments(filter),
    ]);
    // Fetch the doctors for this page in a single query, then join in memory.
    const doctorIds = [...new Set(patients.map((patient) => patient.doctorId.toString()))];
    const doctors = await Doctor.find({ _id: { $in: doctorIds } })
        .select("name specialization")
        .lean()
        .exec();
    const doctorMap = new Map(doctors.map((doctor) => [doctor._id.toString(), doctor]));
    return {
        data: patients.map((patient) => {
            const doctor = doctorMap.get(patient.doctorId.toString());
            return {
                id: patient._id.toString(),
                name: patient.name,
                age: patient.age,
                gender: patient.gender,
                condition: patient.condition,
                phone: patient.phone,
                email: patient.email,
                doctor: doctor
                    ? {
                        id: doctor._id.toString(),
                        name: doctor.name,
                        specialization: doctor.specialization,
                    }
                    : null,
                createdAt: patient.createdAt.toISOString(),
            };
        }),
        pagination: buildPagination(total, query.page, query.limit),
    };
}
export async function createPatient(input) {
    await connectToDatabase();
    const doctor = await Doctor.findById(input.doctorId).select("name specialization").lean();
    if (!doctor) {
        throw new HttpError(400, "The selected doctor no longer exists.", {
            doctorId: ["Choose an existing doctor."],
        });
    }
    const patient = await Patient.create(input);
    return {
        id: patient._id.toString(),
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        condition: patient.condition,
        phone: patient.phone,
        email: patient.email,
        doctor: {
            id: doctor._id.toString(),
            name: doctor.name,
            specialization: doctor.specialization,
        },
        createdAt: patient.createdAt.toISOString(),
    };
}
export async function updatePatient(id, input) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) {
        throw new HttpError(404, "Patient not found.");
    }
    const doctor = await Doctor.findById(input.doctorId).select("name specialization").lean();
    if (!doctor) {
        throw new HttpError(400, "The selected doctor no longer exists.", {
            doctorId: ["Choose an existing doctor."],
        });
    }
    const patient = await Patient.findByIdAndUpdate(id, input, {
        returnDocument: "after",
        runValidators: true,
    }).lean();
    if (!patient) {
        throw new HttpError(404, "Patient not found.");
    }
    return {
        id: patient._id.toString(),
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        condition: patient.condition,
        phone: patient.phone,
        email: patient.email,
        doctor: {
            id: doctor._id.toString(),
            name: doctor.name,
            specialization: doctor.specialization,
        },
        createdAt: patient.createdAt.toISOString(),
    };
}
export async function deletePatient(id) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) {
        throw new HttpError(404, "Patient not found.");
    }
    const patient = await Patient.findByIdAndDelete(id).lean();
    if (!patient) {
        throw new HttpError(404, "Patient not found.");
    }
    return { id };
}
//# sourceMappingURL=patients.js.map