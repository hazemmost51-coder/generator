// 1. تعريف المصفوفة مرة واحدة فقط (تم دمج التعريفين)
let generators = JSON.parse(localStorage.getItem("generatorData")) || []; 

const modal = document.getElementById("modal");
const genForm = document.getElementById("genForm");
const list = document.getElementById("generatorsList");
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxpOKa1ioKdlzuJc40tjnD0aeOQ-LTbQJiddr2tYPDRiTRY7KnqUKODIlLISGYzeW9O/exec";

// استدعاء البيانات عند التشغيل
fetchFromSheets();

// دالة حفظ البيانات في LocalStorage
function saveToLocalStorage() {
    localStorage.setItem("generatorData", JSON.stringify(generators));
}

// 2. دالة جلب البيانات من Google Sheets (تصحيح: لا تعيد تعريف المصفوفة، بل تحدد قيمتها)
async function fetchFromSheets() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        if (data && data.length > 0) {
            generators = data;
            renderCards();
            saveToLocalStorage();
        }
    } catch (error) {
        console.error("خطأ في جلب البيانات من جوجل:", error);
        renderCards(); // سيعرض البيانات الموجودة أصلاً في المصفوفة (من الذاكرة المحلية)
    }
}

// 3. دالة حساب الساعات (تأكد أنها تعمل بشكل صحيح)
function calculateOperatingHours(feedDate, startTime, removeDate, stopTime) {
    if (!feedDate || !startTime || !removeDate || !stopTime) return "0";
    const startDateTime = new Date(`${feedDate}T${startTime}`);
    const endDateTime = new Date(`${removeDate}T${stopTime}`);
    const diffInMs = endDateTime - startDateTime; 
    if (diffInMs <= 0) return "0 (خطأ في الوقت)";
    return (diffInMs / (1000 * 60 * 60)).toFixed(2); 
}

// 4. دالة الحفظ الموحدة (إضافة/تعديل + جوجل شيت + ذاكرة محلية)
genForm.onsubmit = async function(e) {
    e.preventDefault();
    
    const editIndex = document.getElementById("editIndex").value;
    const genData = {
    office: document.getElementById("office").value,
    reportNo: document.getElementById("reportNo").value,
    feedDate: String(document.getElementById("feedDate").value), // التأكد من تحويلها لنص
    feedTask: document.getElementById("feedTask").value,
    removeDate: String(document.getElementById("removeDate").value),
    removeTask: document.getElementById("removeTask").value,
    faultType: document.getElementById("faultType").value,
    equipNo: document.getElementById("equipNo").value,
    requestTime: String(document.getElementById("requestTime").value),
    startTime: String(document.getElementById("startTime").value),
    stopTime: String(document.getElementById("stopTime").value),
    totalHours: genData.totalHours, // القيمة المحسوبة مسبقاً
    genNo: document.getElementById("genNo").value,
    notes: document.getElementById("notes").value,
};

    genData.totalHours = calculateOperatingHours(
        genData.feedDate, genData.startTime, 
        genData.removeDate, genData.stopTime
    );

    if (editIndex === "-1") {
        // حالة الإضافة الجديدة
        try {
            // إرسال لجوجل شيت
            await fetch(SCRIPT_URL, {
                method: "POST",
                mode: 'no-cors', // مهم لتجنب مشاكل الـ CORS مع تطبيقات جوجل
                body: JSON.stringify(genData)
            });
        } catch (error) {
            console.warn("فشل الإرسال لجوجل، تم الحفظ محلياً");
        }
        generators.push(genData); 
    } else {
        // حالة التعديل
        generators[editIndex] = genData; 
    }

    saveToLocalStorage();
    renderCards();
    modal.style.display = "none";
    this.reset();
};

// 5. وظيفة عرض البطاقات (تعديل طفيف لضمان الحذف)
function renderCards() {
    list.innerHTML = "";
    generators.forEach((gen, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.style = "border: 1px solid #ccc; padding: 10px; margin: 10px; border-radius: 8px; background: #fff;";
        card.innerHTML = `
            <h3>مكتب: ${gen.office} (مولد ${gen.genNo})</h3>
            <p><strong>رقم البلاغ:</strong> ${gen.reportNo}</p>
            <p><strong>العطل:</strong> ${gen.faultType}</p>
            <p>ساعات التشغيل: <strong>${gen.totalHours} ساعة</strong></p>
            <button onclick="editGenerator(${index})" class="edit-btn">تعديل البيانات</button>
        `;
        list.appendChild(card);
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
