const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyMGFcqXpNvo0pPHgo3bY45Q1-Oxf6w84SvHl2hwar4r8-8rQPxxkb9Cdp5B47eNVo5/exec";

let generators = JSON.parse(localStorage.getItem("generatorData")) || [];

const modal = document.getElementById("modal");
const genForm = document.getElementById("genForm");
const list = document.getElementById("generatorsList");

// تشغيل الجلب/ فور فتح الصفحة
fetchFromSheets();

async function fetchFromSheets() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        if (data.length > 0) {
            generators = data;
            renderCards();
            saveToLocalStorage();
        }
    } catch (error) {
        console.error("فشل الجلب، عرض البيانات المحلية:", error);
        renderCards();
    }
}

function saveToLocalStorage() {
    localStorage.setItem("generatorData", JSON.stringify(generators));
}

function calculateOperatingHours(startTime, stopTime) {
    if (startTime === undefined || startTime === null || stopTime === undefined || stopTime === null) return "0";
    
    const start = parseFloat(startTime);
    const stop = parseFloat(stopTime);
    
    if (isNaN(start) || isNaN(stop)) return "0";

    let diff = stop - start;

    // معالجة حالة تخطي منتصف الليل (إذا كان وقت النهاية أصغر من وقت البداية)
    if (diff < 0) {
        diff += 24; 
    }

    return diff.toFixed(2);
}

// 2. حدث إرسال النموذج بعد تعديل استدعاء الدالة
genForm.onsubmit = async function(e) {
    e.preventDefault();
    
    const editIndex = document.getElementById("editIndex").value;
    
    // التعديل هنا: نمرر فقط وقت البداية ووقت النهاية للدالة الجديدة
    const hours = calculateOperatingHours(
        document.getElementById("startTime").value,
        document.getElementById("stopTime").value
    );

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
        totalHours: hours // سيتم تخزين الناتج العشري هنا
    };

    // إرسال البيانات لجوجل سواء كانت إضافة أو تعديل
    // السكريبت سيبحث عن رقم البلاغ ويقرر (تحديث أم إضافة)
    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(genData)
    });

    if (editIndex === "-1") {
        generators.push(genData);
    } else {
        generators[editIndex] = genData;
    }

    saveToLocalStorage();
    renderCards();
    modal.style.display = "none";
    genForm.reset();
};


function renderCards() {
    list.innerHTML = "";
    generators.forEach((gen, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.style = "border: 1px solid #ccc; padding: 10px; margin: 10px; border-radius: 8px; background: #fff;";
        card.innerHTML = `
            <h3>مكتب: ${gen.office} (مولد ${gen.genNo})</h3>
            <p><strong>رقم البلاغ:</strong> ${gen.reportNo}</p>
            <p>ساعات التشغيل: <strong>${gen.totalHours} ساعة</strong></p>
            <button onclick="editGenerator(${index})" class="edit-btn">تعديل البيانات</button>
        `;
        list.appendChild(card);
    });
}

// أزرار فتح وإغلاق النافذة
document.getElementById("addBtn").onclick = () => {
    genForm.reset();
    document.getElementById("editIndex").value = "-1";
    document.getElementById("modalTitle").innerText = "إضافة مولد جديد";
    modal.style.display = "block";
};

document.querySelector(".close").onclick = () => modal.style.display = "none";

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
// وظيفة استخراج البيانات إلى ملف إكسيل
document.getElementById("exportBtn").onclick = function() {
    if (generators.length === 0) {
        alert("لا توجد بيانات لتصديرها!");
        return;
    }

    // إنشاء ورقة عمل من البيانات
    const worksheet = XLSX.utils.json_to_sheet(generators);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المولدات");

    // تحميل الملف باسم محدد
    XLSX.writeFile(workbook, `تقرير_المولدات_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
};
/* // وظيفة مسح جميع البيانات (بدء شهر جديد)
//document.getElementById("newMonthBtn").onclick = function() {
    const confirmDelete = confirm("هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذه الخطوة.");
    
    if (confirmDelete) {
        // مسح المصفوفة
        generators = [];
        
        // مسح الذاكرة المحلية
        localStorage.removeItem("generatorData");
        
        // تحديث الواجهة
        renderCards();
        
        alert("تم مسح جميع البيانات بنجاح.");
    }
}; */
