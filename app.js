 --- app.js ---

 1. Firebase Configuration (আপনার নিজের কনফিগারেশন এখানে যোগ করুন)

const firebaseConfig = {
  apiKey: "AIzaSyB-L_xxtiAZOLGsI-uCUkmpF7fjcVdGDlw",
  authDomain: "fgr-sami.firebaseapp.com",
  databaseURL: "https://fgr-sami-default-rtdb.firebaseio.com",
  projectId: "fgr-sami",
  storageBucket: "fgr-sami.firebasestorage.app",
  messagingSenderId: "732874988500",
  appId: "1:732874988500:web:6dddd35b4ebb726d11d441",
  measurementId: "G-QQ6WSLV3PC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
 2. Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const storage = firebase.storage();
const db = firebase.firestore();

 ----------------------------------------------------
 A. LOGIN LOGIC (index.html এর জন্য)
 ----------------------------------------------------

 Ensure loginForm exists before adding event listener
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) = {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const authError = document.getElementById('authError');

        authError.classList.add('d-none');  Hide previous errors

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) = {
                 Successful login
                window.location.href = admin.html;
            })
            .catch((error) = {
                 Failed login
                authError.textContent = error.message;
                authError.classList.remove('d-none');
            });
    });
}


 ----------------------------------------------------
 B. LOGOUT LOGIC (admin.html এর জন্য)
 ----------------------------------------------------

const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
    logoutButton.addEventListener('click', () = {
        auth.signOut().then(() = {
             Sign-out successful.
            window.location.href = index.html;
        }).catch((error) = {
             An error happened.
            console.error(Logout Error , error);
        });
    });
}


 ----------------------------------------------------
 C. FILE UPLOAD LOGIC (admin.html এর জন্য)
 ----------------------------------------------------

const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) = {
        e.preventDefault();

        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        const appName = document.getElementById('appName').value;
        const appDescription = document.getElementById('appDescription').value;
        const uploadProgress = document.getElementById('uploadProgress');
        const uploadProgressContainer = document.getElementById('uploadProgressContainer');
        const uploadStatus = document.getElementById('uploadStatus');
        const uploadButton = document.getElementById('uploadButton');

        if (!file) {
            uploadStatus.innerHTML = 'div class=alert alert-warningPlease select a file to upload.div';
            return;
        }

        uploadButton.disabled = true;
        uploadStatus.innerHTML = '';
        uploadProgressContainer.style.display = 'block';

        const storageRef = storage.ref(`uploads${file.name}`);
        const uploadTask = storageRef.put(file);

         Track upload progress
        uploadTask.on('state_changed', 
            (snapshot) = {
                 Calculate percentage
                const progress = (snapshot.bytesTransferred  snapshot.totalBytes)  100;
                uploadProgress.style.width = progress + '%';
                uploadProgress.textContent = Math.round(progress) + '%';
            }, 
            (error) = {
                 Handle unsuccessful uploads
                uploadStatus.innerHTML = `div class=alert alert-dangerUpload failed ${error.message}div`;
                uploadButton.disabled = false;
                uploadProgressContainer.style.display = 'none';
            }, 
            async () = {
                 Handle successful uploads on complete
                try {
                    const downloadURL = await storageRef.getDownloadURL();
                    
                     Save file metadata to Firestore
                    await db.collection(files).add({
                        name appName,
                        description appDescription,
                        url downloadURL,
                        filename file.name,
                        uploadedAt firebase.firestore.FieldValue.serverTimestamp()
                    });

                    uploadStatus.innerHTML = 'div class=alert alert-successFile uploaded successfully!div';
                    uploadForm.reset();  Clear form
                    uploadButton.disabled = false;
                    uploadProgressContainer.style.display = 'none';
                    loadFiles();  Reload file list
                } catch (error) {
                    uploadStatus.innerHTML = `div class=alert alert-dangerDatabase save failed ${error.message}div`;
                    uploadButton.disabled = false;
                }
            }
        );
    });
}

 ----------------------------------------------------
 D. LOAD FILES LOGIC (admin.html এর জন্য)
 ----------------------------------------------------

const fileListContainer = document.getElementById('fileList');

window.loadFiles = function() {
    if (!fileListContainer) return;

    fileListContainer.innerHTML = document.getElementById('loadingText')  document.getElementById('loadingText').outerHTML  '';  Clear existing list

    db.collection(files).orderBy(uploadedAt, desc).get()
        .then((querySnapshot) = {
            fileListContainer.innerHTML = '';  Clear loading text
            if (querySnapshot.empty) {
                fileListContainer.innerHTML = 'p class=text-muted text-centerNo files uploaded yet.p';
                return;
            }

            querySnapshot.forEach((doc) = {
                const fileData = doc.data();
                const listItem = document.createElement('a');
                listItem.href = fileData.url;
                listItem.target = _blank;  Open in new tab
                listItem.className = 'list-group-item list-group-item-action flex-column align-items-start mb-2';
                
                 Format the upload date
                const date = fileData.uploadedAt  new Date(fileData.uploadedAt.toDate())  new Date();
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

                listItem.innerHTML = `
                    div class=d-flex w-100 justify-content-between
                        h5 class=mb-1 text-success${fileData.name}h5
                        small class=text-mutedUploaded ${formattedDate}small
                    div
                    p class=mb-1${fileData.description}p
                    small class=text-primaryDownload ${fileData.filename}small
                `;
                fileListContainer.appendChild(listItem);
            });
        })
        .catch((error) = {
            console.error(Error loading files , error);
            fileListContainer.innerHTML = 'div class=alert alert-dangerFailed to load files. Check console for details.div';
        });
}