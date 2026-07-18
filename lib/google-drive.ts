import { google } from "googleapis";

// Helper to get Google Auth
export const getGoogleAuth = () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error("Google API credentials are missing from environment variables.");
  }

  return new google.auth.GoogleAuth({
    credentials: {
      private_key: privateKey,
      client_email: clientEmail,
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
};

// Create an empty folder in Google Drive
export const createDriveFolder = async (folderName: string, parentFolderId?: string) => {
  const auth = getGoogleAuth();
  const drive = google.drive({ version: "v3", auth });

  const fileMetadata: Record<string, any> = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };

  // If you want to place it inside a specific main folder (e.g. "Customers")
  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId];
  }

  try {
    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id, name, webViewLink",
    });
    return file.data; // { id: "...", name: "...", webViewLink: "..." }
  } catch (err) {
    console.error("Google Drive folder creation error:", err);
    throw err;
  }
};

// List image files in a specific folder
export const listFilesInFolder = async (folderId: string) => {
  const auth = getGoogleAuth();
  const drive = google.drive({ version: "v3", auth });

  try {
    const res = await drive.files.list({
      // Fetch all files in the folder (removes mimeType restriction to support RAW, HEIC, etc.)
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, thumbnailLink, imageMediaMetadata, createdTime)",
      orderBy: "name",
      pageSize: 100, 
    });
    return res.data.files || [];
  } catch (err) {
    console.error("Google Drive list files error:", err);
    throw err;
  }
};

// Fetch files grouped by raw, selected (edited folder), and final (final/delivered folder)
export const getGalleryFilesGrouped = async (folderId: string) => {
  const auth = getGoogleAuth();
  const drive = google.drive({ version: "v3", auth });

  try {
    // 1. Fetch folders and files in the root folder
    const rootRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, thumbnailLink, imageMediaMetadata, createdTime)",
      orderBy: "name",
      pageSize: 1000,
    });
    
    const rootItems = rootRes.data.files || [];
    const rootFiles = rootItems.filter(f => f.mimeType !== "application/vnd.google-apps.folder");
    const subfolders = rootItems.filter(f => f.mimeType === "application/vnd.google-apps.folder");

    let editedFiles: any[] = [];
    let finalFiles: any[] = [];

    // 2. Look for "edited" and "final" folders
    for (const folder of subfolders) {
      const folderName = folder.name?.toLowerCase() || "";
      const isEdited = folderName.includes("edit") || folderName.includes("seç");
      const isFinal = folderName.includes("final") || folderName.includes("deliver") || folderName.includes("teslim");

      if (isEdited || isFinal) {
        const res = await drive.files.list({
          q: `'${folder.id}' in parents and trashed = false`,
          fields: "files(id, name, mimeType, thumbnailLink, imageMediaMetadata, createdTime)",
          orderBy: "name",
          pageSize: 1000,
        });
        
        if (isFinal) {
          finalFiles = [...finalFiles, ...(res.data.files || [])];
        } else {
          editedFiles = [...editedFiles, ...(res.data.files || [])];
        }
      }
    }

    return {
      raw: rootFiles,
      selected: editedFiles,
      final: finalFiles
    };
  } catch (err) {
    console.error("Google Drive grouped files error:", err);
    throw err;
  }
};

// Get a file stream to serve to the client securely
export const getFileStream = async (fileId: string) => {
  const auth = getGoogleAuth();
  const drive = google.drive({ version: "v3", auth });

  try {
    // First, get the MIME type for proper Content-Type headers
    const fileMeta = await drive.files.get({
      fileId,
      fields: "mimeType",
    });

    // Request the file content as a stream
    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    return {
      stream: res.data as NodeJS.ReadableStream,
      mimeType: fileMeta.data.mimeType || "application/octet-stream",
    };
  } catch (err) {
    console.error("Google Drive get stream error:", err);
    throw err;
  }
};

// Move multiple files to a new folder
export const moveFilesToFolder = async (fileIds: string[], newParentId: string, oldParentId: string) => {
  const auth = getGoogleAuth();
  const drive = google.drive({ version: "v3", auth });

  try {
    const promises = fileIds.map(fileId => 
      drive.files.update({
        fileId: fileId,
        addParents: newParentId,
        removeParents: oldParentId,
        fields: "id, parents"
      })
    );
    await Promise.all(promises);
    return true;
  } catch (err) {
    console.error("Google Drive move files error:", err);
    throw err;
  }
};
