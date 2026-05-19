# ⚙️ Kalpa Power - Document control system (Onedrive based)

## 🎯 Project Vision
To digitize and secure the lifecycle of engineering designs (PDF and CAD) from upload to site construction, using a automated, two-stage approval workflow


## 📚 The Architecture Flow

<img width="2550" height="2200" alt="Kalpa Architecture flow example" src="https://github.com/user-attachments/assets/99182ba1-ed98-48aa-9bb0-a741b17df538" />


### 🔍 Our system enforces a mandatory hierarchy:

Designer: Uploads files (PDF/CAD) into the central system. They are stored in a secure 'Working' area.

1. Line Manager: Performs technical verification against CAD standards. They must either Approve or Reject. Rejection returns the file immediately to the Designer's Working area for revision.

2. Department Manager (Dept Head): Performs final cross-functional approval.

3. System Automation (The "Brain"): This is where automation replaces manual work:

  - Once a Department Head approves, the system automatically detects the file type.

  - PDF Files: Triggers a PDF Manipulation Framework (e.g., PDF-Lib via Supabase Edge Functions) to burn a physical approval stamp onto the drawing.

  - CAD Files (.dwg): Generates a JSON Metadata Payload. This payload is ingested by our custom AutoLISP script to update the "Status", "Approved By", and "Date" attributes within the CAD file’s Title Block automatically.

5. Version Control & Archiving: When a new version is approved, the System automatically migrates older versions to a read-only Archive Folder.

6. Site Team: Can only access files marked as "Approved and Stamped" via the system, eliminating construction errors caused by outdated drawings.
