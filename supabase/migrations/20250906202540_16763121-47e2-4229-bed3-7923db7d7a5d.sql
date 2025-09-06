-- Phase 3: Enable RLS and create policies for new tables

-- Enable RLS on all Phase 3 tables
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_access_logs ENABLE ROW LEVEL SECURITY;

-- Create function to check if user can access department data
CREATE OR REPLACE FUNCTION public.can_access_department_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_role text;
  current_user_dept text;
  target_user_dept text;
BEGIN
  -- Get current user's role and department
  SELECT ur.role::text INTO current_user_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  ORDER BY CASE ur.role
    WHEN 'super_admin' THEN 1
    WHEN 'ceo' THEN 2
    WHEN 'cfo' THEN 3
    WHEN 'hr' THEN 4
    ELSE 99
  END
  LIMIT 1;

  -- Super admins, CEOs, CFOs, and HR can access all data
  IF current_user_role IN ('super_admin', 'ceo', 'cfo', 'hr') THEN
    RETURN true;
  END IF;

  -- Department heads can only access their department data
  IF current_user_role = 'department_head' THEN
    SELECT p1.department INTO current_user_dept
    FROM public.profiles p1
    WHERE p1.user_id = auth.uid();
    
    SELECT p2.department INTO target_user_dept
    FROM public.profiles p2
    WHERE p2.user_id = target_user_id;
    
    RETURN current_user_dept = target_user_dept;
  END IF;

  -- Users can only access their own data
  RETURN auth.uid() = target_user_id;
END;
$$;

-- Dashboard widgets policies
CREATE POLICY "Users can manage their own dashboard widgets"
ON dashboard_widgets FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all dashboard widgets in their agency"
ON dashboard_widgets FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Custom reports policies
CREATE POLICY "Users can manage their own custom reports"
ON custom_reports FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view public reports in their agency"
ON custom_reports FOR SELECT
USING (is_public = true AND agency_id = get_user_agency_id());

CREATE POLICY "Admins can view all reports in their agency"
ON custom_reports FOR SELECT
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) AND agency_id = get_user_agency_id());

-- Document folders policies
CREATE POLICY "Users can view document folders in their agency"
ON document_folders FOR SELECT
USING (agency_id = get_user_agency_id());

CREATE POLICY "Authorized users can manage document folders"
ON document_folders FOR ALL
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) AND agency_id = get_user_agency_id())
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) AND agency_id = get_user_agency_id());

-- Documents policies
CREATE POLICY "Users can view documents in their agency"
ON documents FOR SELECT
USING (agency_id = get_user_agency_id() AND (is_public = true OR uploaded_by = auth.uid() OR EXISTS (
  SELECT 1 FROM document_permissions dp 
  WHERE dp.document_id = documents.id AND dp.user_id = auth.uid() AND dp.permission_type IN ('read', 'write', 'admin')
)));

CREATE POLICY "Users can upload documents to their agency"
ON documents FOR INSERT
WITH CHECK (agency_id = get_user_agency_id() AND uploaded_by = auth.uid());

CREATE POLICY "Users can update their own documents or documents they have write access to"
ON documents FOR UPDATE
USING (agency_id = get_user_agency_id() AND (uploaded_by = auth.uid() OR EXISTS (
  SELECT 1 FROM document_permissions dp 
  WHERE dp.document_id = documents.id AND dp.user_id = auth.uid() AND dp.permission_type IN ('write', 'admin')
)))
WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Users can delete their own documents or documents they have admin access to"
ON documents FOR DELETE
USING (agency_id = get_user_agency_id() AND (uploaded_by = auth.uid() OR EXISTS (
  SELECT 1 FROM document_permissions dp 
  WHERE dp.document_id = documents.id AND dp.user_id = auth.uid() AND dp.permission_type = 'admin'
)));

-- Document versions policies
CREATE POLICY "Users can view document versions they have access to"
ON document_versions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM documents d 
  WHERE d.id = document_versions.document_id 
  AND (d.is_public = true OR d.uploaded_by = auth.uid() OR EXISTS (
    SELECT 1 FROM document_permissions dp 
    WHERE dp.document_id = d.id AND dp.user_id = auth.uid()
  ))
));

CREATE POLICY "Users can create versions for documents they have write access to"
ON document_versions FOR INSERT
WITH CHECK (uploaded_by = auth.uid() AND EXISTS (
  SELECT 1 FROM documents d 
  WHERE d.id = document_versions.document_id 
  AND (d.uploaded_by = auth.uid() OR EXISTS (
    SELECT 1 FROM document_permissions dp 
    WHERE dp.document_id = d.id AND dp.user_id = auth.uid() AND dp.permission_type IN ('write', 'admin')
  ))
));

-- Document permissions policies
CREATE POLICY "Users can view permissions for documents they have access to"
ON document_permissions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM documents d 
  WHERE d.id = document_permissions.document_id 
  AND (d.uploaded_by = auth.uid() OR EXISTS (
    SELECT 1 FROM document_permissions dp2 
    WHERE dp2.document_id = d.id AND dp2.user_id = auth.uid() AND dp2.permission_type = 'admin'
  ))
));

CREATE POLICY "Document owners and admins can manage permissions"
ON document_permissions FOR ALL
USING (granted_by = auth.uid() OR EXISTS (
  SELECT 1 FROM documents d 
  WHERE d.id = document_permissions.document_id AND d.uploaded_by = auth.uid()
))
WITH CHECK (granted_by = auth.uid() OR EXISTS (
  SELECT 1 FROM documents d 
  WHERE d.id = document_permissions.document_id AND d.uploaded_by = auth.uid()
));

-- Message threads policies
CREATE POLICY "Users can view message threads they participate in"
ON message_threads FOR SELECT
USING (agency_id = get_user_agency_id() AND (created_by = auth.uid() OR EXISTS (
  SELECT 1 FROM thread_participants tp 
  WHERE tp.thread_id = message_threads.id AND tp.user_id = auth.uid()
)));

CREATE POLICY "Users can create message threads in their agency"
ON message_threads FOR INSERT
WITH CHECK (agency_id = get_user_agency_id() AND created_by = auth.uid());

CREATE POLICY "Thread creators can update their threads"
ON message_threads FOR UPDATE
USING (agency_id = get_user_agency_id() AND created_by = auth.uid())
WITH CHECK (agency_id = get_user_agency_id() AND created_by = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in threads they participate in"
ON messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM thread_participants tp 
  WHERE tp.thread_id = messages.thread_id AND tp.user_id = auth.uid()
));

CREATE POLICY "Users can send messages to threads they participate in"
ON messages FOR INSERT
WITH CHECK (sender_id = auth.uid() AND EXISTS (
  SELECT 1 FROM thread_participants tp 
  WHERE tp.thread_id = messages.thread_id AND tp.user_id = auth.uid()
));

-- Thread participants policies
CREATE POLICY "Users can view thread participants for threads they're in"
ON thread_participants FOR SELECT
USING (EXISTS (
  SELECT 1 FROM thread_participants tp2 
  WHERE tp2.thread_id = thread_participants.thread_id AND tp2.user_id = auth.uid()
));

CREATE POLICY "Thread creators can manage participants"
ON thread_participants FOR ALL
USING (EXISTS (
  SELECT 1 FROM message_threads mt 
  WHERE mt.id = thread_participants.thread_id AND mt.created_by = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM message_threads mt 
  WHERE mt.id = thread_participants.thread_id AND mt.created_by = auth.uid()
));

-- API access logs policies
CREATE POLICY "Super admins can view all API access logs"
ON api_access_logs FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can insert API access logs"
ON api_access_logs FOR INSERT
WITH CHECK (true);