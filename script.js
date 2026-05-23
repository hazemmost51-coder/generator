const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyMGFcqXpNvo0pPHgo3bY45Q1-Oxf6w84SvHl2hwar4r8-8rQPxxkb9Cdp5B47eNVo5/exec";

let generators = JSON.parse(localStorage.getItem("generatorData")) || [];

const modal = document.getElementById("modal");
const genForm = document.getElementById("genForm");
const list = document.getElementById("generatorsList");

// تشغيل الجلب فور فتح الصفحة
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

// 1. تشكيل الحقول ديناميكياً لتناسب طبيعة العداد التراكمي المطلوب
function toggleInputTypes() {
    const genNo = document.getElementById("genNo").value;
    const startTimeInput = document.getElementById("startTime");
    const stopTimeInput = document.getElementById("stopTime");
    const startLabel = document.getElementById("startLabel");
    const stopLabel = document.getElementById("stopLabel");

    if (genNo === "220") {
        startTimeInput.type = "number";
        startTimeInput.step = "0.01";
        startTimeInput.placeholder = "مثال: 5231.75";
        startLabel.innerText = "عداد التشغيل (رقم عشري):";

        stopTimeInput.type = "number";
        stopTimeInput.step = "0.01";
        stopTimeInput.placeholder = "مثال: 5240.50";
        stopLabel.innerText = "عداد الفصل (رقم عشري):";
    } else {
        startTimeInput.type = "text";
        startTimeInput.placeholder = "مثال: 5200:30";
        startLabel.innerText = "عداد التشغيل (ساعة:دقيقة):";

        stopTimeInput.type = "text";
        stopTimeInput.placeholder = "مثال: 5202:11";
        stopLabel.innerText = "عداد الفصل (ساعة:دقيقة):";
    }
}

// 2. دالة حساب الساعات للمولد 220 (طرح عشري مباشر)
function calculateDecimalHours(startVal, stopVal) {
    const start = parseFloat(startVal);
    const stop = parseFloat(stopVal);
    
    if (isNaN(start) || isNaN(stop)) return "0";
    
    let diff = stop - start;
    if (diff < 0) return "خطأ: قراءة الفصل أقل من التشغيل";
    return diff.toFixed(2);
}

// 3. دالة حساب الساعات لمولدات 400 بنظام الستينات (ساعات:دقائق فـعـلـيـة)
function calculateAccumulatedTimeHours(startTime, stopTime) {
    if (!startTime || !stopTime) return "0:00";

    const timeRegex = /^(\d+):([0-5]?\d)$/;
    
    if (!timeRegex.test(startTime) || !timeRegex.test(stopTime)) {
        return "خطأ في صيغة الوقت (استخدم سس:دد)";
    }

    const startMatches = startTime.match(timeRegex);
    const startHours = parseInt(startMatches[1], 10);
    const startMinutes = parseInt(startMatches[2], 10);

    const stopMatches = stopTime.match(timeRegex);
    const stopHours = parseInt(stopMatches[1], 10);
    const stopMinutes = parseInt(stopMatches[2], 10);

    // تحويل الكل إلى دقائق إجمالية
    const startTotalMinutes = (startHours * 60) + startMinutes;
    const stopTotalMinutes = (stopHours * 60) + stopMinutes;

    let diffMinutes = stopTotalMinutes - startTotalMinutes;

    if (diffMinutes < 0) {
        return "خطأ: قراءة الفصل أقل من التشغيل";
    }

    // استخراج الساعات والدقائق المتبقية من ناتج الطرح
    const resultHours = Math.floor(diffMinutes / 60);
    const resultMinutes = diffMinutes % 60;

    // إضافة صفر على اليسار للدقائق إذا كانت أقل من 10 لتظهر بشكل منسق (مثل 1:05 بدلاً من 1:5)
    const formattedMinutes = resultMinutes < 10 ? '0' + resultMinutes : resultMinutes;

    // إرجاع النتيجة بالصيغة المطلوبة (ساعات:دقائق)
    return `${resultHours}:${formattedMinutes}`;
}

// حدث إرسال النموذج
genForm.onsubmit = async function(e) {
    e.preventDefault();
    
    const editIndex = document.getElementById("editIndex").value;
    const genNo = document.getElementById("genNo").value;
    const startTimeVal = document.getElementById("startTime").value.trim();
    const stopTimeVal = document.getElementById("stopTime").value.trim();
    
    let hours = "0";
    if (genNo === "220") {
        hours = calculateDecimalHours(startTimeVal, stopTimeVal);
    } else {
        hours = calculateAccumulatedTimeHours(startTimeVal, stopTimeVal);
    }

    if (hours.includes("خطأ")) {
        alert(hours);
        return;
    }

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
        startTime: startTimeVal,
        stopTime: stopTimeVal,
        genNo: genNo,
        notes: document.getElementById("notes").value,
        totalHours: hours // سيتم حفظها إما كـ رقم عشري أو بصيغة (ساعات:دقائق) حسب نوع المولد
    };

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
        
        // تخصيص التسمية التوضيحية لنوع العداد بناء على نوع المولد في العرض
        const unitText = gen.genNo === "220" ? `${gen.totalHours} ساعة` : `${gen.totalHours} (ساعة:دقيقة)`;

        card.innerHTML = `
            <h3>مكتب: ${gen.office} (مـولـد ${gen.genNo})</h3>
            <p><strong>رقم البلاغ:</strong> ${gen.reportNo}</p>
            <p>صافي مدة التشغيل: <strong>${unitText}</strong></p>
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
    toggleInputTypes(); 
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
    document.getElementById("genNo").value = gen.genNo;
    
    toggleInputTypes();
    
    document.getElementById("startTime").value = gen.startTime || "";
    document.getElementById("stopTime").value = gen.stopTime || "";
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
    const worksheet = XLSX.utils.json_to_sheet(generators);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المولدات");
    XLSX.writeFile(workbook, `تقرير_المولدات_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
};

// وظيفة مسح جميع البيانات (بدء شهر جديد)
document.getElementById("newMonthBtn").onclick = function() {
    const confirmDelete = confirm("هل أنت متأكد من مسح جميع البيانات محلياً؟ لا يمكن التراجع عن هذه الخطوة.");
    if (confirmDelete) {
        generators = [];
        localStorage.removeItem("generatorData");
        renderCards();
        alert("تم مسح البيانات المحلية بنجاح.");
    }
};
