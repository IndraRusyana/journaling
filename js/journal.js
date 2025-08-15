const { doc, getDoc, setDoc, deleteDoc, collection, query, getDocs, orderBy, writeBatch } = firebase.firestore;
const { onAuthStateChanged, signOut } = firebase.auth;

// ===== Utilities =====
const pad = n => String(n).padStart(2, '0');
const toKey = (date) => `journal::${date}`;
const todayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${y}-${m}-${day}`;
};
const parseISO = (s) => new Date(`${s}T00:00:00`);

// Debounce helper
function debounce(fn, delay = 400) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), delay); };
}

// ===== DOM Refs =====
const $ = (sel) => document.querySelector(sel);
const entryDate = $('#entryDate');
const inputs = {
    morningMood: $('#morningMood'),
    mainGoal: $('#mainGoal'),
    g1: $('#g1'), g2: $('#g2'), g3: $('#g3'),
    affirmation: $('#affirmation'),
    dayPlan: $('#dayPlan'),
    nightMood: $('#nightMood'),
    keyEvents: $('#keyEvents'),
    lesson: $('#lesson'),
    ng1: $('#ng1'), ng2: $('#ng2'), ng3: $('#ng3'),
    notes: $('#notes'),
    tomorrow: $('#tomorrow')
};

// ===== State Management =====
let currentUser = null;

// ===== Storage Ops =====
async function readEntry(dateStr) {
    if (!currentUser) return null;
    const docRef = doc(db, 'users', currentUser.uid, 'journals', dateStr);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (e) {
        console.error('readEntry error', e);
        return null;
    }
}

async function writeEntry(dateStr, data) {
    if (!currentUser) return;
    const docRef = doc(db, 'users', currentUser.uid, 'journals', dateStr);
    try {
        await setDoc(docRef, data, { merge: true });
        updateStreak();
        toast('Disimpan ke Cloud');
    } catch (e) {
        console.error('writeEntry error', e);
        toast('Gagal menyimpan');
    }
}

async function clearEntry(dateStr) {
    if (!currentUser) return;
    if (!confirm('Kosongkan catatan untuk tanggal ini?')) return;
    const docRef = doc(db, 'users', currentUser.uid, 'journals', dateStr);
    try {
        await deleteDoc(docRef);
        fillForm(null);
        updateStreak();
        toast('Jurnal dihapus');
    } catch (e) {
        console.error('clearEntry error', e);
        toast('Gagal menghapus');
    }
}

function collectForm() {
    return {
        morning: {
            mood: inputs.morningMood.value.trim(),
            goal: inputs.mainGoal.value.trim(),
            gratitude: [inputs.g1.value.trim(), inputs.g2.value.trim(), inputs.g3.value.trim()],
            affirmation: inputs.affirmation.value.trim(),
            plan: inputs.dayPlan.value.trim()
        },
        night: {
            mood: inputs.nightMood.value.trim(),
            events: inputs.keyEvents.value.trim(),
            lesson: inputs.lesson.value.trim(),
            gratitude: [inputs.ng1.value.trim(), inputs.ng2.value.trim(), inputs.ng3.value.trim()],
            notes: inputs.notes.value.trim(),
            tomorrow: inputs.tomorrow.value.trim()
        },
        meta: { updatedAt: new Date().toISOString() }
    };
}

function fillForm(data) {
    const d = data || { morning: {}, night: {} };
    inputs.morningMood.value = d?.morning?.mood || '';
    inputs.mainGoal.value = d?.morning?.goal || '';
    inputs.g1.value = d?.morning?.gratitude?.[0] || '';
    inputs.g2.value = d?.morning?.gratitude?.[1] || '';
    inputs.g3.value = d?.morning?.gratitude?.[2] || '';
    inputs.affirmation.value = d?.morning?.affirmation || '';
    inputs.dayPlan.value = d?.morning?.plan || '';

    inputs.nightMood.value = d?.night?.mood || '';
    inputs.keyEvents.value = d?.night?.events || '';
    inputs.lesson.value = d?.night?.lesson || '';
    inputs.ng1.value = d?.night?.gratitude?.[0] || '';
    inputs.ng2.value = d?.night?.gratitude?.[1] || '';
    inputs.ng3.value = d?.night?.gratitude?.[2] || '';
    inputs.notes.value = d?.night?.notes || '';
    inputs.tomorrow.value = d?.night?.tomorrow || '';
}

// ===== UI Actions =====
async function loadFor(dateStr) {
    entryDate.value = dateStr;
    const data = await readEntry(dateStr);
    fillForm(data);
    updateStreak();
}

async function saveCurrent() {
    const dateStr = entryDate.value || todayStr();
    const data = collectForm();
    await writeEntry(dateStr, data);
    toast('Disimpan');
}

async function clearCurrent() {
    const dateStr = entryDate.value || todayStr();
    if (!confirm('Kosongkan catatan untuk tanggal ini?')) return;
    await clearEntry(dateStr);
    fillForm(null);
}

async function exportAll() {
    if (!currentUser) {
        toast('Pengguna belum login');
        return;
    }
    const q = query(collection(db, 'users', currentUser.uid, 'journals'), orderBy('date', 'asc'));
    const querySnapshot = await getDocs(q);
    const all = {};
    querySnapshot.forEach(doc => {
        all[doc.id] = doc.data();
    });

    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `journal-export-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function importAll(file) {
    if (!currentUser) {
        toast('Pengguna belum login');
        return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const data = JSON.parse(reader.result);
            const keys = Object.keys(data || {});
            let importedCount = 0;
            for (const dateStr of keys) {
                const docRef = doc(db, 'users', currentUser.uid, 'journals', dateStr);
                await setDoc(docRef, data[dateStr]);
                importedCount++;
            }
            toast(`Impor selesai (${importedCount} hari)`);
            loadFor(entryDate.value);
        } catch (e) {
            console.error('Import error:', e);
            alert('File tidak valid');
        }
    };
    reader.readAsText(file);
}

function printPage() {
    window.print();
}

function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast align-items-center text-bg-dark border-0 position-fixed bottom-0 end-0 m-3';
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
    document.body.appendChild(el);
    const t = new bootstrap.Toast(el, { delay: 1500 });
    t.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}

async function updateStreak() {
    if (!currentUser) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    for (let i = 0; i < 3650; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        const docRef = doc(db, 'users', currentUser.uid, 'journals', ds);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && (data.morning?.mood || data.night?.mood || data.morning?.goal || data.night?.notes)) {
                streak++;
            } else {
                break;
            }
        } else {
            break;
        }
    }
    document.getElementById('streakDays').textContent = streak;
}

function stepDate(delta) {
    const d = parseISO(entryDate.value || todayStr());
    d.setDate(d.getDate() + delta);
    const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    loadFor(ds);
}

// ===== Events =====
document.addEventListener('DOMContentLoaded', () => {

    onAuthStateChanged(auth, user => {
        if (user) {
            currentUser = user;
            console.log("User is logged in:", user.uid);

            entryDate.value = todayStr();
            loadFor(todayStr());

            document.getElementById('btnSave').addEventListener('click', saveCurrent);
            document.getElementById('btnClear').addEventListener('click', clearCurrent);
            document.getElementById('btnToday').addEventListener('click', () => loadFor(todayStr()));
            document.getElementById('btnPrev').addEventListener('click', () => stepDate(-1));
            document.getElementById('btnNext').addEventListener('click', () => stepDate(1));
            document.getElementById('btnExport').addEventListener('click', exportAll);
            document.getElementById('btnPrint').addEventListener('click', printPage);
            document.getElementById('btnResetAll').addEventListener('click', async () => {
                if (!confirm('Hapus semua data jurnal di perangkat ini?')) return;
                const q = query(collection(db, 'users', currentUser.uid, 'journals'));
                const querySnapshot = await getDocs(q);
                const batch = writeBatch(db);
                querySnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                loadFor(entryDate.value);
                toast('Semua data terhapus');
            });
            document.getElementById('fileImport').addEventListener('change', (e) => {
                const f = e.target.files?.[0];
                if (f) importAll(f);
                e.target.value = '';
            });
            entryDate.addEventListener('change', () => loadFor(entryDate.value));

            const debouncedSave = debounce(() => {
                const dateStr = entryDate.value || todayStr();
                writeEntry(dateStr, collectForm());
            }, 600);

            Object.values(inputs).forEach(el => {
                el.addEventListener('input', debouncedSave);
            });

        } else {
            console.log("No user is logged in.");
            window.location.href = 'login.html';
        }
    });

    document.getElementById('btnLogout').addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error("Logout error:", error);
        });
    });
});