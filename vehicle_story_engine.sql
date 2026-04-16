-- =====================================================
-- AUTOFY VEHICLE STORY ENGINE - DATABASE SCHEMA
-- =====================================================

-- Table: vehicle_processing_jobs
-- Stores each vehicle processing job and its status
CREATE TABLE vehicle_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vin TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    -- Status: pending, processing, draft, review, published, archived
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    -- Original uploaded files (stored as JSON array of file paths)
    uploaded_files JSONB DEFAULT '[]',
    uploaded_photos JSONB DEFAULT '[]',
    
    -- Processing metadata
    processed_by TEXT,
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    
    -- OMVIC disclosure path (A = issues found, B = clean)
    disclosure_path TEXT CHECK (disclosure_path IN ('A', 'B')),
    
    -- Notes from dealer
    dealer_notes TEXT,
    
    -- Vehicle link (optional - connects to existing vehicles table)
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL
);

-- Table: vehicle_ai_outputs
-- Stores the AI-generated outputs (draft and published versions)
CREATE TABLE vehicle_ai_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES vehicle_processing_jobs(id) ON DELETE CASCADE,
    
    -- Version type
    version_type TEXT NOT NULL CHECK (version_type IN ('draft', 'published')),
    
    -- Full AI output as JSON
    output_data JSONB NOT NULL,
    
    -- Individual extracted fields for easier querying
    listing_headline TEXT,
    story_narrative TEXT,
    confidence_score INTEGER,
    confidence_notes TEXT,
    
    -- History flags (locked fields)
    has_total_loss BOOLEAN DEFAULT FALSE,
    has_structural_damage BOOLEAN DEFAULT FALSE,
    has_airbag_deployment BOOLEAN DEFAULT FALSE,
    has_flood_damage BOOLEAN DEFAULT FALSE,
    has_rebuilt_title BOOLEAN DEFAULT FALSE,
    
    -- Damage summary
    damage_summary TEXT,
    undisclosed_damage_flags JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    
    -- Ensure only one published version per job
    CONSTRAINT unique_published UNIQUE (job_id, version_type) 
);

-- Table: vehicle_history_flags
-- Stores locked OMVIC compliance flags (cannot be edited)
CREATE TABLE vehicle_history_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES vehicle_processing_jobs(id) ON DELETE CASCADE,
    
    -- Flag type (locked)
    flag_type TEXT NOT NULL CHECK (flag_type IN (
        'total_loss',
        'structural_damage',
        'airbag_deployment',
        'flood_damage',
        'rebuilt_title',
        'accident_damage',
        'odometer_rollback',
        'other'
    )),
    
    -- Flag details
    flag_value BOOLEAN DEFAULT TRUE,
    flag_source TEXT,
    flag_description TEXT,
    
    -- Locked status (OMVIC requirement)
    is_locked BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: vehicle_photo_captions
-- Stores AI-generated captions for each photo
CREATE TABLE vehicle_photo_captions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES vehicle_processing_jobs(id) ON DELETE CASCADE,
    
    -- Photo reference
    photo_path TEXT NOT NULL,
    photo_order INTEGER DEFAULT 0,
    
    -- AI generated caption
    caption_text TEXT,
    caption_version TEXT DEFAULT 'draft',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT
);

-- Table: vehicle_damage_descriptions
-- Stores damage descriptions per panel
CREATE TABLE vehicle_damage_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES vehicle_processing_jobs(id) ON DELETE CASCADE,
    
    -- Panel location
    panel_name TEXT NOT NULL,
    
    -- Damage details
    damage_description TEXT,
    damage_severity TEXT CHECK (damage_severity IN ('minor', 'moderate', 'major', 'severe')),
    repair_completed BOOLEAN DEFAULT FALSE,
    repair_quality TEXT,
    
    -- Locked status (OMVIC)
    is_locked BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: vehicle_audit_log
-- Full audit trail for OMVIC compliance
CREATE TABLE vehicle_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES vehicle_processing_jobs(id) ON DELETE CASCADE,
    
    -- Action details
    action_type TEXT NOT NULL CHECK (action_type IN (
        'created',
        'files_uploaded',
        'processing_started',
        'draft_generated',
        'draft_edited',
        'section_regenerated',
        'published',
        'archived',
        'compliance_warning'
    )),
    
    -- Who did it
    performed_by TEXT,
    
    -- What changed
    changes_summary TEXT,
    previous_value TEXT,
    new_value TEXT,
    
    -- Full snapshot at this point
    snapshot_data JSONB,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: compliance_warnings
-- Stores compliance warnings and resolutions
CREATE TABLE compliance_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES vehicle_processing_jobs(id) ON DELETE CASCADE,
    
    -- Warning details
    warning_type TEXT NOT NULL,
    warning_message TEXT NOT NULL,
    severity TEXT DEFAULT 'error' CHECK (severity IN ('warning', 'error', 'critical')),
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_processing_jobs_status ON vehicle_processing_jobs(status);
CREATE INDEX idx_processing_jobs_vin ON vehicle_processing_jobs(vin);
CREATE INDEX idx_processing_jobs_created ON vehicle_processing_jobs(created_at DESC);
CREATE INDEX idx_ai_outputs_job_id ON vehicle_ai_outputs(job_id);
CREATE INDEX idx_audit_log_job_id ON vehicle_audit_log(job_id);
CREATE INDEX idx_audit_log_created ON vehicle_audit_log(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE vehicle_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_ai_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_history_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_photo_captions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_damage_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_warnings ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users (dealers)
CREATE POLICY "Dealers can manage their vehicle jobs" ON vehicle_processing_jobs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Dealers can manage AI outputs" ON vehicle_ai_outputs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Dealers can manage history flags" ON vehicle_history_flags
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Dealers can manage photo captions" ON vehicle_photo_captions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Dealers can manage damage descriptions" ON vehicle_damage_descriptions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Dealers can view audit log" ON vehicle_audit_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Dealers can manage compliance warnings" ON compliance_warnings
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_processing_jobs_updated_at
    BEFORE UPDATE ON vehicle_processing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_photo_captions_updated_at
    BEFORE UPDATE ON vehicle_photo_captions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_damage_descriptions_updated_at
    BEFORE UPDATE ON vehicle_damage_descriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_entry(
    p_job_id UUID,
    p_action_type TEXT,
    p_performed_by TEXT DEFAULT NULL,
    p_changes_summary TEXT DEFAULT NULL,
    p_snapshot_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_entry_id UUID;
BEGIN
    INSERT INTO vehicle_audit_log (
        job_id, action_type, performed_by, changes_summary, snapshot_data
    ) VALUES (
        p_job_id, p_action_type, p_performed_by, p_changes_summary, p_snapshot_data
    ) RETURNING id INTO v_entry_id;
    
    RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER FOR AUTO-AUDIT ON PUBLISH
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_publish_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version_type = 'published' AND OLD.version_type = 'draft' THEN
        PERFORM create_audit_entry(
            NEW.job_id,
            'published',
            NEW.created_by,
            'Vehicle story published',
            NEW.output_data
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER publish_audit_trigger
    AFTER INSERT ON vehicle_ai_outputs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_publish_audit();

-- =====================================================
-- VIEWS FOR ADMIN DASHBOARD
-- =====================================================

-- View: processing_jobs_with_latest_output
CREATE OR REPLACE VIEW processing_jobs_with_latest AS
SELECT 
    pj.*,
    (
        SELECT output_data 
        FROM vehicle_ai_outputs 
        WHERE job_id = pj.id AND version_type = 'published'
        ORDER BY created_at DESC
        LIMIT 1
    ) as published_output,
    (
        SELECT output_data 
        FROM vehicle_ai_outputs 
        WHERE job_id = pj.id AND version_type = 'draft'
        ORDER BY created_at DESC
        LIMIT 1
    ) as draft_output,
    (
        SELECT COUNT(*) 
        FROM vehicle_audit_log 
        WHERE job_id = pj.id
    ) as audit_count
FROM vehicle_processing_jobs pj
ORDER BY pj.updated_at DESC;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Vehicle Story Engine tables created successfully!' as status;
