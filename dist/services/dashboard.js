import { format, startOfMonth, subMonths } from "date-fns";
import { connectToDatabase } from "../db.js";
import { Doctor } from "../models/doctor.js";
import { Patient } from "../models/patient.js";
export async function getDashboardData() {
    await connectToDatabase();
    const now = new Date();
    const monthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const chartStart = startOfMonth(subMonths(now, 5));
    const [doctors, patients, patientsThisMonth, patientsLastMonth, specializations, doctorCounts, conditionRows, growthRows, recentPatients,] = await Promise.all([
        Doctor.countDocuments({}),
        Patient.countDocuments({}),
        Patient.countDocuments({ createdAt: { $gte: monthStart } }),
        Patient.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: monthStart } }),
        Doctor.distinct("specialization"),
        getPatientsPerDoctor(),
        Patient.aggregate([
            { $group: { _id: "$condition", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $project: { _id: 0, name: "$_id", count: 1 } },
        ]),
        Patient.aggregate([
            { $match: { createdAt: { $gte: chartStart } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } },
                    count: { $sum: 1 },
                },
            },
        ]),
        getRecentPatients(),
    ]);
    const growthMap = new Map(growthRows.map((row) => [row._id, row.count]));
    const growth = Array.from({ length: 6 }, (_, index) => {
        const month = subMonths(now, 5 - index);
        const key = format(month, "yyyy-MM");
        return {
            month: key,
            label: format(month, "MMM"),
            count: growthMap.get(key) ?? 0,
        };
    });
    return {
        totals: {
            doctors,
            patients,
            patientsThisMonth,
            patientsLastMonth,
            specializations: specializations.length,
            averagePatients: doctors === 0 ? 0 : Math.round((patients / doctors) * 10) / 10,
        },
        patientsPerDoctor: doctorCounts,
        conditions: conditionRows,
        growth,
        recentPatients,
    };
}
async function getPatientsPerDoctor() {
    const rows = await Patient.aggregate([
        { $group: { _id: "$doctorId", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 6 },
        {
            $lookup: {
                from: "doctors",
                localField: "_id",
                foreignField: "_id",
                as: "doctor",
            },
        },
        { $unwind: "$doctor" },
        {
            $project: {
                _id: 0,
                doctorId: "$_id",
                name: "$doctor.name",
                specialization: "$doctor.specialization",
                hospital: "$doctor.hospital",
                count: 1,
            },
        },
    ]);
    return rows.map((row) => ({
        id: row.doctorId.toString(),
        name: row.name,
        specialization: row.specialization,
        hospital: row.hospital,
        patientCount: row.count,
    }));
}
async function getRecentPatients() {
    const patients = await Patient.find({})
        .select("name age gender condition phone email doctorId createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .lean()
        .exec();
    const doctorIds = [...new Set(patients.map((patient) => patient.doctorId.toString()))];
    const doctors = await Doctor.find({ _id: { $in: doctorIds } })
        .select("name specialization")
        .lean()
        .exec();
    const doctorMap = new Map(doctors.map((doctor) => [doctor._id.toString(), doctor]));
    return patients.map((patient) => {
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
    });
}
//# sourceMappingURL=dashboard.js.map