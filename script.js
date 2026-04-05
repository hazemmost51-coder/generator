// 1. تعريف الرابط والمصفوفة
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyVVKb90qtCehzJiWvQC7jCNNAeP-Cb09aPPfmJy6IAkyNS-TGvtD3G2LrXzwaey-Q/exec"; 
let generators = [];

const modal = document.getElementById("modal");
const genForm = document.getElementById("genForm");
const list = document.getElementById("generatorsList");

// جلب البيانات فور تشغيل الصفحة
fetchFromSheets();

async function fetchFromSheets() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        // دمج البيانات القادمة مع الذاكرة المحلية أو استبدالها
        generators = data;
        renderCards();
    } catch (error) {
        console.error("فشل الجلب من جوجل، تحميل البيانات المحلية...");
        generators = JSON.parse(localStorage.getItem("generatorData")) || [];
        renderCards();
    }
}

function saveToLocalStorage() {
    localStorage.setItem("generatorData", JSON.stringify(generators));
}

// حساب فرق الساعات
function calculateOperatingHours(feedDate, startTime, removeDate, stopTime) {
    if (!feedDate || !startTime || !removeDate || !stopTime) return "0";
    const startDateTime = new Date(`${feedDate}T${startTime}`);
    const endDateTime = new Date(`${removeDate}T${stopTime}`);
    const diffInMs = endDateTime - startDateTime; 
    if (diffInMs <= 0) return "0 (خطأ)";
    return (diffInMs / (1000 * 60 * 60)).toFixed(2); 
}

// حفظ البيانات (إضافة أو تعديل)
genForm.onsubmit = async function(e) {
    e.preventDefault();
    
    const editIndex = document.getElementById("editIndex").value;
    const genData = {
        office: document.getElementById("office").value,
        reportNo: document.getElementById("reportNo").value,
        feedDate: document.getElementById("feedDate").value,
        feedTask: document.getElementById("feedTask").value,
        removeDate: document.getElementById("removeDate").value,
        removeTask: document.getElementById("removeTask").value,
        faultType: document.getElementById("faultType").value,
        equipNo: document.getElementById("equipNo").value,
        requestTime: document.getElementById("requestTime").value,
        startTime: document.getElementById("startTime").value,
        stopTime: document.getElementById("stopTime").value,
        genNo: document.getElementById("genNo").value,
        notes: document.getElementById("notes").value,
    };

    genData.totalHours = calculateOperatingHours(
        genData.feedDate, genData.startTime, 
        genData.removeDate, genData.stopTime
    );

    if (editIndex === "-1") {
        // إرسال لجوجل شيت
        try {
            await fetch(SCRIPT_URL, {
                method: "POST",
                mode: "no-cors", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(genData)
            });
            generators.push(genData);
        } catch (err) {
            console.error("خطأ في الكتابة:", err);
            generators.push(genData);
        }
    } else {
        generators[editIndex] = genData; 
    }

    saveToLocalStorage();
    modal.style.display = "none";
    this.reset();
    renderCards();
};

function renderCards() {
    list.innerHTML = "";
    generators.forEach((gen, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.style = "border: 1px solid #ccc; padding: 15px; margin: 10px; border-radius: 8px; background: #fff; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);";
        
        // استخدام المسميات البرمجية لضمان القراءة الصحيحة
        card.innerHTML = `
            <h3 style="margin-top:0;">مكتب: ${gen.office || "بدون اسم"} (مولد ${gen.genNo || "-"})</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 0.9em;">
                <p><strong>رقم البلاغ:</strong> ${gen.reportNo || "-"}</p>
                <p><strong>العطل:</strong> ${gen.faultType || "-"}</p>
                <p><strong>التشغيل:</strong> ${gen.startTime || "-"}</p>
                <p><strong>الإيقاف:</strong> ${gen.stopTime || "-"}</p>
                <p><strong>التاريخ:</strong> ${gen.feedDate || "-"}</p>
                <p><strong>الساعات:</strong> <span style="color:blue">${gen.totalHours || "0"}</span></p>
            </div>
            <button onclick="editGenerator(${index})" style="margin-top:10px; cursor:pointer;">تعديل</button>
        `;
        list.appendChild(card);
    });
}

// نافذة الإضافة
document.getElementById("addBtn").onclick = () => {
    genForm.reset();
    document.getElementById("editIndex").value = "-1"; 
    document.getElementById("modalTitle").innerText = "إضافة مولد جديد";
    modal.style.display = "block";
};

document.querySelector(".close").onclick = () => modal.style.display = "none";

window.editGenerator = (index) => {
    const gen = generators[index];
    // تعبئة الحقول... (نفس كود التعديل السابق)
    Object.keys(gen).forEach(key => {
        const input = document.getElementById(key);
        if(input) input.value = gen[key];
    });
    document.getElementById("editIndex").value = index; 
    document.getElementById("modalTitle").innerText = "تعديل البيانات";
    modal.style.display = "block";
};

// تصدير الإكسيل (بقِيَ كما هو)
document.getElementById("exportBtn").onclick = function() {
    if (generators.length === 0) return alert("لا توجد بيانات!");
    const ws = XLSX.utils.json_to_sheet(generators);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "البيانات");
    XLSX.writeFile(wb, "تقرير_المولدات.xlsx");
};
    });
}

// زر الإضافة
document.getElementById("addBtn").onclick = () => {
    genForm.reset();
    document.getElementById("editIndex").value = "-1"; 
    document.getElementById("modalTitle").innerText = "إضافة مولد جديد";
    modal.style.display = "block";
};

// إغلاق النافذة
document.querySelector(".close").onclick = () => modal.style.display = "none";

// وظيفة جلب البيانات للتعديل
window.editGenerator = (index) => {
    const gen = generators[index];
    document.getElementById("office").value = gen.office;
    document.getElementById("reportNo").value = gen.reportNo;
    document.getElementById("feedDate").value = gen.feedDate;
    document.getElementById("feedTask").value = gen.feedTask;
    document.getElementById("removeDate").value = gen.removeDate;
    document.getElementById("removeTask").value = gen.removeTask;
    document.getElementById("faultType").value = gen.faultType;
    document.getElementById("equipNo").value = gen.equipNo;
    document.getElementById("requestTime").value = gen.requestTime;
    document.getElementById("startTime").value = gen.startTime;
    document.getElementById("stopTime").value = gen.stopTime;
    document.getElementById("genNo").value = gen.genNo;
    document.getElementById("notes").value = gen.notes;

    document.getElementById("editIndex").value = index; 
    document.getElementById("modalTitle").innerText = "تعديل بيانات المولد";
    modal.style.display = "block";
};

// زر "شهر جديد" 
document.getElementById("newMonthBtn").onclick = function() {
    if (confirm("هل أنت متأكد من مسح جميع بيانات الشهر الحالي؟ لا يمكن التراجع!")) {
        generators = []; 
        localStorage.removeItem("generatorData"); 
        renderCards(); 
    }
};

// تصدير إكسيل (بافتراض وجود المكتبة)
document.getElementById("exportBtn").onclick = function() {
    if (generators.length === 0) return alert("لا توجد بيانات!");
    try {
        const ws = XLSX.utils.json_to_sheet(generators);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "بيانات المولدات");
        XLSX.writeFile(wb, "تقرير_تشغيل_المولدات.xlsx");
    } catch (e) { alert("تأكد من وجود مكتبة XLSX."); }
};
// دالة الإضافة لجوجل شيت في كود الـ JavaScript
async function addToSheets(genData) {
    try {
        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", // لحل مشاكل الحماية في المتصفحات
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(genData)
        });
        console.log("تم الإرسال بنجاح");
    } catch (error) {
        console.error("فشل الإرسال:", error);
    }
}
