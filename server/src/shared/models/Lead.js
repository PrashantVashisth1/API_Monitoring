import mongoose from 'mongoose';

/**
 * Lead.js — MongoDB schema for access request leads.
 *
 * A Lead is created when a public visitor fills the "Request Access" form
 * on the landing page. It sits in a pending state until a super_admin
 * reviews and approves it, which atomically creates a Client + client_admin.
 *
 * Status lifecycle:  pending → approved | rejected
 */
const LEAD_STATUSES = ['pending', 'approved', 'rejected'];

const leadSchema = new mongoose.Schema(
    {
        // ── Visitor-submitted fields ─────────────────────────────────────────
        name: {
            type:      String,
            required:  true,
            trim:      true,
            maxlength: 100,
        },
        email: {
            type:      String,
            required:  true,
            lowercase: true,
            trim:      true,
            validate: {
                validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
                message:   'Invalid email address',
            },
        },
        company: {
            type:      String,
            required:  true,
            trim:      true,
            maxlength: 100,
        },
        website: {
            type:    String,
            default: '',
            trim:    true,
        },

        // ── Status tracking ──────────────────────────────────────────────────
        status: {
            type:    String,
            enum:    LEAD_STATUSES,
            default: 'pending',
            index:   true,
        },

        // ── Super admin review fields ────────────────────────────────────────
        notes: {
            type:    String,
            default: '',
            maxlength: 500,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  'User',
        },
        approvedAt: {
            type: Date,
        },
        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  'User',
        },
        rejectedAt: {
            type: Date,
        },

        // ── Links to created entities (set on approval) ──────────────────────
        // Stored so the super_admin can trace which Client came from which Lead.
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  'Client',
        },
    },
    {
        timestamps: true,   // createdAt, updatedAt
        collection: 'leads',
    }
);

// Unique email: one lead per company email address.
// Prevents the same visitor from submitting multiple requests.
leadSchema.index({ email: 1 }, { unique: true });

// Compound index for the super_admin list page (filter by status, sort by date).
leadSchema.index({ status: 1, createdAt: -1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
