import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import PDFDocument from 'pdfkit';
import 'pdfkit-table';
import xlsx from 'xlsx'; 
import multer from 'multer';

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();
// app.use(
//   session({
//     secret: "TOPSECRETWORD",
//     resave: false,
//     saveUninitialized: true,
//   })
// );
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// app.use(passport.initialize());
// app.use(passport.session());

const upload = multer({ dest: 'uploads/' });

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Libmanagement",
  password: "012005",
  port: 5432,
});
db.connect();

app.get("/", (req, res) => {
  res.render("index.ejs");
});

function maxvalue(value1){
    let max = 0;
    var racks;
    racks = value1;
    for(var i=0;i<racks.length;i++){
        if(racks[i]>max){
            max = racks[i];
        }
    }
    return max;
}

app.get("/contactus",(req,res) =>{
    res.render("contactus.ejs");
});

app.get("/searchbooks" ,(req,res) => {
    res.send("To be developed");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/stafflogin", (req, res) => {
  res.render("stafflogin.ejs");
});

//Edit table details

var bebookid;
app.get("/edit/:id",async (req,res) => {
  const id = req.params;
  bebookid=id.id
  res.render("updatebook.ejs");
});

app.post("/editbook", async(req,res) => {
   const ebookid = req.body["book-id"];
   const erackno = req.body["rack-number"];
   try{
   await db.query('update libverifiedbooks set bookid=$1 , rackno=$2 where bookid=$3',[ebookid,erackno,bebookid]);
   }catch(err){
    console.error("Error in updating data ",err.stack);
   }
   res.redirect("/showlist");
});



//Stock Verification
var listedStaff=[];
var vbookList =[];
app.get("/stockverify", async(req, res) => {
    try{
        const res = await db.query('SELECT sfname,slname FROM libstaff');
        const columns = {};
        res.fields.forEach(field => {
            columns[field.name] = [];
        });
        res.rows.forEach(row => {
            res.fields.forEach(field => {
                columns[field.name].push(row[field.name]);
            });
        });
        var sFname=columns.sfname;
        var slname=columns.slname;
        for(var i=0;i<sFname.length;i++)
        {
            listedStaff[i]=sFname[i]+' '+slname[i];
        }
    } catch (err) {
        console.error('Error executing query', err.stack);
    }
console.log(listedStaff);
res.render("stockverify.ejs",{
  listedstaff: listedStaff,
});
});
var staffName;
var vrackNo;
var vbookid;
app.post("/listedstaff",async (req,res)=>{
  staffName=req.body["value"];
  vrackNo=req.body["rack-no"];
  (staffName);
  vbookList=[];
  if(vrackNo == 0 || staffName=="Select Staff")
    {
      res.render("stockverify.ejs",{
        warn: "Please Select Valid Details",
        listedstaff: listedStaff,
      });
    }else{
      var vresult = await db.query('Select * from libverifiedbooks where staff=$1 and rackno=$2',[staffName,vrackNo]);
      const columns={};
      vresult.fields.forEach(field => {
        columns[field.name] = [];
      });
    
      vresult.rows.forEach(row => {
        vresult.fields.forEach(field => {
            columns[field.name].push(row[field.name]);
      })
      vbookList=columns.bookid;
      });
    res.render("afterverify.ejs",{
      vstaffname:staffName,
      vrackno: vrackNo,
      bookId: vbookList,
    })
  }
});


var erack;
var file;
var bookcolumn=[];
app.post("/verifybookid",upload.single('file'),async (req,res)=>{
  vbookid=req.body["vbookid"];
  file=req.file;
  if(file){
  const workbook = xlsx.readFile(file.path);
  const sheet_name = workbook.SheetNames[0];
  const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name]);
  bookcolumn = [];
  try{
  for (var i=0;i<sheet.length;i++) {
    // Assuming you have columns: `column1`, `column2`, `column3` in your table
    bookcolumn[i] = sheet[i].bookid
    await db.query("Insert into libverifiedbooks (bookid,rackno,staff) values ($1,$2,$3)",[bookcolumn[i],vrackNo,staffName]);
  }
    return res.redirect("/showlist");
  }
  catch(err){
    var Vbooks=[];
    var vresult = await db.query('Select * from libverifiedbooks where staff=$1 and rackno=$2',[staffName,vrackNo]);
  const columns={};
  vresult.fields.forEach(field => {
    columns[field.name] = [];
  });

  vresult.rows.forEach(row => {
    vresult.fields.forEach(field => {
        columns[field.name].push(row[field.name]);
  })
  Vbooks=columns.bookid;
  });
    return res.render("afterverify.ejs",{
      warn: "The Book with Id "+bookcolumn[i]+" may not exists or already entered ",
      vstaffname:staffName,
      vrackno: vrackNo,
      bookId: Vbooks,
    })
  }
  }
  async function addvbooks() {
    var col={};
    var cmpbook=[];
    var cmp=await db.query("Select * from libverifiedbooks;")
    cmp.fields.forEach(field => {
      col[field.name] = [];
    });

    cmp.rows.forEach(row => {
      cmp.fields.forEach(field => {
        col[field.name].push(row[field.name]);
    })
      cmpbook=col.bookid;
    });
    if(cmpbook.includes(vbookid))
    {
        var vresult = await db.query('Select * from libverifiedbooks where staff=$1 and rackno=$2',[staffName,vrackNo]);
        const columns={};
        vresult.fields.forEach(field => {
          columns[field.name] = [];
        });

        vresult.rows.forEach(row => {
          vresult.fields.forEach(field => {
            columns[field.name].push(row[field.name]);
        })
          vbookList=columns.bookid;
        });
        var brno= await db.query('Select rackno,staff from libverifiedbooks where bookid=$1',[vbookid]);
        erack=brno.rows[0].rackno;
        var rstaff=brno.rows[0].staff;
      return res.render("afterverify.ejs",{
        warn: "The Book with Id "+vbookid+" already exists in rack number "+erack+" verified by "+rstaff,
        vstaffname:staffName,
        vrackno: vrackNo,
        bookId: vbookList,
      })
    }
    else{
     try{
      await db.query('insert into libverifiedbooks (bookid,rackno,staff) values ($1,$2,$3);',[vbookid,vrackNo,staffName]);
      }catch(err){
        return res.render("afterverify.ejs",{
          warn: "The Book with Id "+vbookid+" does not exists ",
          vstaffname:staffName,
          vrackno: vrackNo,
          bookId: vbookList,
        })
     }
   }
   res.redirect("/showlist");
 }
  addvbooks();
});
app.get("/showlist",async (req,res)=> {
  var vresult = await db.query('Select * from libverifiedbooks where staff=$1 and rackno=$2',[staffName,vrackNo]);
  const columns={};
  vresult.fields.forEach(field => {
    columns[field.name] = [];
  });

  vresult.rows.forEach(row => {
    vresult.fields.forEach(field => {
        columns[field.name].push(row[field.name]);
  })
  vbookList=columns.bookid;
  });
    res.render("afterverify.ejs",{
    vstaffname:staffName,
    vrackno: vrackNo,
    bookId: vbookList,
  })

});


var lsname =[];
var ulsname=[];
var lrackno = [];
var ulrackno = [];
app.get("/getpdf", async (req, res) => {
    try{
        const res = await db.query('SELECT distinct on (staff,rackno) staff,rackno FROM libverifiedbooks');
        const columns = {};
        res.fields.forEach(field => {
            columns[field.name] = [];
        });
        res.rows.forEach(row => {
            res.fields.forEach(field => {
                columns[field.name].push(row[field.name]);
            });
        });
        lsname=columns.staff;
        lrackno=columns.rackno;
        ulsname=[...new Set(lsname)]
        ulrackno=[...new Set(lrackno)];
        ulrackno.sort((a, b) => a - b);
    } catch (err) {
        console.error('Error executing query', err.stack);
    }
  res.render("downloadreport.ejs",{
    stafflist: ulsname,
    maxrackno: ulrackno,
    dstafflist:[],
    vrackno: 0,
    bookId:[],
    drackno:[],
  });
});


//Report Flows
var rackNo;
var sName;
var dStafflist=[];
var dRackno=[];
app.post("/getrackno",(req,res)=>{
  rackNo=req.body["rvalue"];
  sName=req.body["svalue"];
  res.redirect('/showdata');
});

app.get("/showdata",async(req,res)=>{
  try{
  vbookList=[];
  dStafflist=[];
  dRackno=[];
  var vresult = await db.query('Select * from libverifiedbooks where staff=$1 and rackno=$2',[sName,rackNo]);
  const columns={};
  vresult.fields.forEach(field => {
    columns[field.name] = [];
  });

  vresult.rows.forEach(row => {
    vresult.fields.forEach(field => {
        columns[field.name].push(row[field.name]);
  })
  vbookList=columns.bookid;
  dStafflist=columns.staff;
  dRackno=columns.rackno;

  });
    return res.render("downloadreport.ejs",{
    vrackno: rackNo,
    maxrackno: ulrackno,
    stafflist: ulsname,
    dstafflist: dStafflist,
    drackno: dRackno,
    bookId: vbookList,
  })
}catch(err){
  return res.render("downloadreport.ejs",{
    warn: "Please Select the valid details",
    vrackno: 0,
    maxrackno: ulrackno,
    stafflist: ulsname,
    dstafflist: [],
    drackno: [],
    bookId: [],
  })
}
});

//Download a pdf report
app.get("/download-pdf", async (req, res) => {
  try {
    const result =await db.query('SELECT * FROM libverifiedbooks where rackno=$1 and staff=$2',[rackNo,sName]);
    const rcount = await db.query('select count(*) from libverifiedbooks where rackno=$1 and staff=$2',[rackNo,sName]);
    const doc = new PDFDocument();
    const countlist =[];
    for(var i=0;i<rcount.rows[0].count;i++)
    {
      countlist[i]=i+1;
    }
    // Set the headers before piping the PDF document
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Report-'+sName+'.pdf')
    doc.pipe(res);
    doc.fontSize(20).text('Staff Name : '+sName+ '   Rack no : ' + rackNo, { underline: true, align: 'center' });
    doc.moveDown(2);
    const columns={};
    result.fields.forEach(field => {
      columns[field.name] = [];
    });

    result.rows.forEach(row => {
      result.fields.forEach(field => {
          columns[field.name].push(row[field.name]);
      });
    });
    const headers = ['Sl.no', 'Book Id'];
    const data = [
        countlist,
        columns.bookid,
    ];
    // Draw headers
    let startX = 50;
    const startY = 100;
    const rowHeight = 20;
    const colWidth = 150;

    headers.forEach((header, colIndex) => {
      doc.font('Helvetica-Bold').fontSize(12).text(header, startX + colIndex * colWidth, startY);
  });
    // Draw rows
    data.forEach((colData, colIndex) => {
      colData.forEach((item, rowIndex) => {
          doc.font('Helvetica').fontSize(10).text(item, startX + colIndex * colWidth, startY + (rowIndex + 1) * rowHeight);
      });
  });
    doc.end();
} catch (err) {
    // If an error occurs, we need to ensure the response is not sent twice
    if (!res.headersSent) {
        res.status(500).send('Please Select the valid options');
    } else {
        console.error('Failed to send PDF:', err);
    }
}
});


//Download a Xlsx report
app.get("/download-xlsv", async (req, res) => {
  console.log("Pdf download route");
  try {
    db.query('SELECT * FROM libverifiedbooks where staff=$1 and rackno=$2',[sName,rackNo], (err, result) => {
      if (err) {
          console.error('Error executing query:', err);
          res.status(500).send('Please Select the valid options');
          return;
      }
      const data = result.rows;
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(data);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      res.setHeader('Content-Disposition', 'attachment; filename="Report.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      // Send the buffer as the response
      res.send(excelBuffer);
  });

}catch(err){
  console.log("Error");
}
});


//Download All verified books

app.get("/download-xlsx-all", async (req, res) => {
  console.log("Pdf download route");
  try {
    db.query('SELECT * FROM libverifiedbooks order by bookid asc', (err, result) => {
      if (err) {
          console.error('Error executing query:', err);
          res.status(500).send('Error generating Excel file');
          return;
      }
      const data = result.rows;

      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(data);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      res.setHeader('Content-Disposition', 'attachment; filename="Report.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(excelBuffer);
  });

}catch(err){
  console.log("Error");
}
});

//Missing Books Xlsx
app.get("/Missing-xlsx", async (req, res) => {
  console.log("Pdf download route");
  try {
    db.query('SELECT bookid FROM libbooks WHERE bookid NOT IN (SELECT bookid FROM libverifiedbooks)', (err, result) => {
      if (err) {
          console.error('Error executing query:', err);
          res.status(500).send('Error generating Excel file');
          return;
      }

      // Get the query results as an array of objects
      const data = result.rows;

      // Create a new workbook and add a worksheet with the query results
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(data);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      // Generate the Excel file buffer
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      // Set headers to prompt a file download
      res.setHeader('Content-Disposition', 'attachment; filename="Missing-Books-Report.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      // Send the buffer as the response
      res.send(excelBuffer);
  });

}catch(err){
  console.log("Error");
}
});

//Missing libbooks download
app.get("/missing-pdf", async (req, res) => {
  console.log("Pdf download route");
  try {
    const result =await db.query('SELECT bookid FROM libbooks WHERE bookid NOT IN (SELECT bookid FROM libverifiedbooks);');
    const doc = new PDFDocument();
    const countlist =[];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Report-Missing.pdf');

    doc.pipe(res)

    const columns={};
    result.fields.forEach(field => {
      columns[field.name] = [];
    });

    result.rows.forEach(row => {
      result.fields.forEach(field => {
          columns[field.name].push(row[field.name]);
      });
    });
    for(var i=0;i<(columns.bookid).length;i++)
      {
        countlist[i]=i+1;
      }
      doc.fontSize(20).text("Missing libbooks", { underline: true, align: 'center' });
     doc.moveDown(5);
     doc.fontSize(15).text("Total number of Missing libbooks :" + (columns.bookid).length, { underline: true, align: 'left' });
     doc.moveDown(5);
    const headers = ['Sl.no', 'Book Id'];
    const data = [
        countlist,
        columns.bookid,
    ];

    let startX = 50;
    const startY = 100;
    const rowHeight = 20;
    const colWidth = 150;

    headers.forEach((header, colIndex) => {
      doc.font('Helvetica-Bold').fontSize(12).text(header, startX + colIndex * colWidth, startY);
  });
    data.forEach((colData, colIndex) => {
      colData.forEach((item, rowIndex) => {
          doc.font('Helvetica').fontSize(10).text(item, startX + colIndex * colWidth, startY + (rowIndex + 1) * rowHeight);
      });
  });
    doc.end();
} catch (err) {
    if (!res.headersSent) {
        res.status(500).send('Please Select the valid options');
    } else {
        console.error('Failed to send PDF:', err);
    }
}
});




app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});



app.get("/addbook", (req, res) => {
    // console.log(req.user);
        res.render("addbook.ejs");
  });

  app.post("/submitbook", (req,res) =>{
    const bookid = req.body["book-id"];
    const bookname = req.body["book-name"];
    const rackno = req.body["rack-number"];

async function addbooks() {
    try{
        console.log("Data base connected");
        await db.query("insert into libbooks (bookid,bookname,rackno,avail) values ($1,$2,$3,true);",[bookid,bookname,rackno]);
        console.log("Data inserted succesfully");
    }catch(err){
        console.error("Error in adding libbooks ",err.stack);
    }
}
    addbooks();

    res.render("addbook.ejs",{
        warn: "book added sussesfully!",
    })
});


  app.get("/returnbook", (req, res) => {
    // console.log(req.user);
        res.render("returnbook.ejs");
  });

  app.post("/submitreturnbook", (req, res) => {
    const bookidi = req.body["book-id"];
    
    async function returnbook() {
        try{
            console.log("Database connected");
            await db.query('delete from libissuedbooks where bookid=$1;',[bookidi]);
            await db.query('update libbooks set avail=true where bookid=$1;',[bookidi]);
            console.log("Data updated successfully");
            return cb("Book Collected Successfully");
        }catch(err){
            console.error("Error in fetchinng data ",err.stack);
        }
    }
    returnbook();

    res.render("returnbook.ejs", {
        warn: "Book Collected Succesfully"
    })
  });


app.get("/issuebooks", (req, res) => {
    // console.log(req.user);
        res.render("issuebooks.ejs");
  });

  app.post("/submitissuebooks", (req, res) => {
    const stdidi = req.body["libstudent-id"];
    const bookidi = req.body["book-id"];
  
    async function issuebook(){
    try{
        console.log("Database connected");
        await db.query("insert into libissuedbooks (bookid,bookname,rackno,stdid,issuedate,duedate,fname) SELECT $1,bookname,rackno,$2,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP+INTERVAL '15 days',fname from libbooks,libstudent where bookid=$3 and stdid=$4;",[bookidi,stdidi,bookidi,stdidi]);
        console.log("Data entered successfully");
        await db.query('update libbooks set avail=false where bookid=$1',[bookidi]);
    }catch(err){
        console.error("Error in issuing libbooks",err.stack);
    }
}
    issuebook();
    if(bookidi == stdidi){
      res.render("issuebooks.ejs",{
        warn: "Book ID Does Not Exist",
    })
    }
    else{
      res.render("issuebooks.ejs",{
        warn: "Book issued sussesfully!",
    })
    }
  })

app.post("/submitbook", (req,res) =>{
    const bookid = req.body["book-id"];
    const bookname = req.body["book-name"];
    const rackno = req.body["rack-number"];
    console.log(bookid, bookname);

async function addbooks() {
    try{
        console.log("Data base connected");
        await db.query("insert into libbooks (bookid,bookname,rackno,avail) values ($1,$2,$3,true);",[bookid,bookname,rackno]);
        console.log("Data inserted succesfully");
    }catch(err){
        console.error("Error in adding libbooks ",err.stack);
    }
}
    addbooks();

    res.render("addbook.ejs",{
        warn: "book added sussesfully!",
    })
});


var aissuedCount;
app.get("/adbooklist", (req, res) => {
  // console.log(req.user);
    async function fetchbookdetails() {
      try {
      
          console.log('Connected to the database');
          const res = await db.query('SELECT * FROM libbooks ');
          var issueDCount = await db.query('select count(*) from libbooks where avail=false');
          aissuedCount = issueDCount.rows[0].count
          // Extract data column-wise
          const columns = {};
          res.fields.forEach(field => {
              columns[field.name] = [];
          });
  
          res.rows.forEach(row => {
              res.fields.forEach(field => {
                  columns[field.name].push(row[field.name]);
              });
          });
         return columns;
  
      } catch (err) {
          console.error('Error executing query', err.stack);
      } 
  }

  fetchbookdetails(0).then(value =>{
      var column = value;
      var bookId=column.bookid;
      var bookName=column.bookname;
      var rackNo=column.rackno;
      var avAil=column.avail;
      var maxracknumber = maxvalue(rackNo);
      res.render("adbooklist.ejs", {
          bookid: bookId,
          bookname: bookName,
          rackno: rackNo,
          avail: avAil,
          issuedcount: aissuedCount,
          maxrackno: maxracknumber,
      })
      
  })
});


// Add libstaff get request
var issuedCount;
app.get("/booklist", (req, res) => {
  // console.log(req.user);
    async function fetchbookdetails() {
      try {
      
          console.log('Connected to the database');
          const res = await db.query('SELECT * FROM libbooks ');
          var issueDCount = await db.query('select count(*) from libbooks where avail=false');
          issuedCount = issueDCount.rows[0].count
          // Extract data column-wise
          const columns = {};
          res.fields.forEach(field => {
              columns[field.name] = [];
          });
  
          res.rows.forEach(row => {
              res.fields.forEach(field => {
                  columns[field.name].push(row[field.name]);
              });
          });
         return columns;
  
      } catch (err) {
          console.error('Error executing query', err.stack);
      } 
  }

  fetchbookdetails(0).then(value =>{
      var column = value;
      var bookId=column.bookid;
      var bookName=column.bookname;
      var rackNo=column.rackno;
      var avAil=column.avail;
      var maxracknumber = maxvalue(rackNo);
      res.render("booklist.ejs", {
          bookid: bookId,
          bookname: bookName,
          rackno: rackNo,
          avail: avAil,
          issuedcount: issuedCount,
          maxrackno: maxracknumber,
      })
      
  })
});

app.post("/aracknumber", (req, res) => {
  var racknumber = req.body["value"];
if(racknumber == 0){
  async function fetchbookdetails() {
      try {
      
          console.log('Connected to the database');
          const res = await db.query('SELECT * FROM libbooks ');
          var issueDCount = await db.query('select count(*) from libbooks where avail=false');
          issuedCount = issueDCount.rows[0].count
          // Extract data column-wise
          const columns = {};
          res.fields.forEach(field => {
              columns[field.name] = [];
          });
  
          res.rows.forEach(row => {
              res.fields.forEach(field => {
                  columns[field.name].push(row[field.name]);
              });
          });
         return columns;
  
      } catch (err) {
          console.error('Error executing query', err.stack);
      } 
  }

  fetchbookdetails(0).then(value =>{
      var column = value;
      var bookId=column.bookid;
      var bookName=column.bookname;
      var rackNo=column.rackno;
      var avAil=column.avail;
      var maxracknumber = maxvalue(rackNo);
      res.render("adbooklist.ejs", {
          bookid: bookId,
          bookname: bookName,
          rackno: rackNo,
          avail: avAil,
          issuedcount: issuedCount,
          maxrackno: maxracknumber,
      })
      
  })
}
else{
  console.log(racknumber)
  async function fetchbookdetails() {
      try {
          console.log('Connected to the database');
          const res = await db.query('SELECT * FROM libbooks where rackno = $1',[racknumber]);
          var issueDCount = await db.query('select count(*) from libbooks where avail=false');
          issuedCount = issueDCount.rows[0].count
          // Extract data column-wise
          const columns = {};
          res.fields.forEach(field => {
              columns[field.name] = [];
          });
  
          res.rows.forEach(row => {
              res.fields.forEach(field => {
                  columns[field.name].push(row[field.name]);
              });
          });
         return columns;
  
      } catch (err) {
          console.error('Error executing query', err.stack);
      } 
  }

  fetchbookdetails().then(value =>{
      var column = value;
      var bookId=column.bookid;
      var bookName=column.bookname;
      var rackNo=column.rackno;
      var avAil=column.avail;
      var rknumber = racknumber;
      var maxracknumber = maxvalue(rackNo);
      res.render("adbooklist.ejs", {
          bookid: bookId,
          bookname: bookName,
          rackno: rackNo,
          avail: avAil,
          racknumber: rknumber,
          issuedcount: issuedCount,
          maxrackno: maxracknumber,
      })
      
  })}
})

app.post("/racknumber", (req, res) => {
  var racknumber = req.body["value"];
if(racknumber == 0){
  async function fetchbookdetails() {
      try {
      
          console.log('Connected to the database');
          const res = await db.query('SELECT * FROM libbooks ');
          var issueDCount = await db.query('select count(*) from libbooks where avail=false');
          issuedCount = issueDCount.rows[0].count
          // Extract data column-wise
          const columns = {};
          res.fields.forEach(field => {
              columns[field.name] = [];
          });
  
          res.rows.forEach(row => {
              res.fields.forEach(field => {
                  columns[field.name].push(row[field.name]);
              });
          });
         return columns;
  
      } catch (err) {
          console.error('Error executing query', err.stack);
      } 
  }

  fetchbookdetails(0).then(value =>{
      var column = value;
      var bookId=column.bookid;
      var bookName=column.bookname;
      var rackNo=column.rackno;
      var avAil=column.avail;
      var maxracknumber = maxvalue(rackNo);
      res.render("booklist.ejs", {
          bookid: bookId,
          bookname: bookName,
          rackno: rackNo,
          avail: avAil,
          issuedcount: issuedCount,
          maxrackno: maxracknumber,
      })
      
  })
}
else{
  console.log(racknumber)
  async function fetchbookdetails() {
      try {
          console.log('Connected to the database');
          const res = await db.query('SELECT * FROM libbooks where rackno = $1',[racknumber]);
          var issueDCount = await db.query('select count(*) from libbooks where avail=false');
          issuedCount = issueDCount.rows[0].count
          // Extract data column-wise
          const columns = {};
          res.fields.forEach(field => {
              columns[field.name] = [];
          });
  
          res.rows.forEach(row => {
              res.fields.forEach(field => {
                  columns[field.name].push(row[field.name]);
              });
          });
         return columns;
  
      } catch (err) {
          console.error('Error executing query', err.stack);
      } 
  }

  fetchbookdetails().then(value =>{
      var column = value;
      var bookId=column.bookid;
      var bookName=column.bookname;
      var rackNo=column.rackno;
      var avAil=column.avail;
      var rknumber = racknumber;
      var maxracknumber = maxvalue(rackNo);
      res.render("booklist.ejs", {
          bookid: bookId,
          bookname: bookName,
          rackno: rackNo,
          avail: avAil,
          racknumber: rknumber,
          issuedcount: issuedCount,
          maxrackno: maxracknumber,
      })
      
  })}
})

function getdatetime(date){
  console.log(date);
  var datetime=[];
  for(var i=0;i<date.length;i++){
   const eventtime = new Date(date[i]);
   const year=eventtime.getFullYear();
   const month=String(eventtime.getMonth()+1).padStart(2,'0');
   const day=String(eventtime.getDate()).padStart(2,'0');
   datetime[i]=String(day+'-'+month+'-'+year);
  }
  return datetime;
}

app.get("/aissuedbooks", (req, res) => {
  // console.log(req.user);
    async function fetchbookdetails() {
      try {
      
          console.log('Connected to the database');
          const res = await db.query('SELECT * FROM libissuedbooks order by issuedate desc');
          var issueDCount = await db.query('select count(*) from libbooks where avail=false');
          issuedCount = issueDCount.rows[0].count
          // Extract data column-wise
          const columns = {};
          res.fields.forEach(field => {
              columns[field.name] = [];
          });
  
          res.rows.forEach(row => {
              res.fields.forEach(field => {
                  columns[field.name].push(row[field.name]);
              });
          });
         return columns;
  
      } catch (err) {
          console.error('Error executing query', err.stack);
      } 
  }

  fetchbookdetails().then(value =>{
      var column = value;
      var bookId=column.bookid;
      var bookName=column.bookname;
      var rackNo=column.rackno;
      var sid =column.stdid;
      var sname = column.fname;
      var ddate = column.duedate;
      var idate = column.issuedate;
      res.render("aissuedbooks.ejs", {
          bookid: bookId,
          bookname: bookName,
          rackno: rackNo,
          issuedate: getdatetime(idate),
          duedate: getdatetime(ddate),
          studentid: sid,
          studentname: sname,
          issuedcount: issuedCount,
      })
      
  })
});

app.get("/issuedbooks", (req, res) => {
  // console.log(req.user);
    async function fetchbookdetails() {
      try {
      
          console.log('Connected to the database');
          const res = await db.query('SELECT * FROM libissuedbooks order by issuedate desc');
          var issueDCount = await db.query('select count(*) from libbooks where avail=false');
          issuedCount = issueDCount.rows[0].count
          // Extract data column-wise
          const columns = {};
          res.fields.forEach(field => {
              columns[field.name] = [];
          });
  
          res.rows.forEach(row => {
              res.fields.forEach(field => {
                  columns[field.name].push(row[field.name]);
              });
          });
         return columns;
  
      } catch (err) {
          console.error('Error executing query', err.stack);
      } 
  }

  fetchbookdetails().then(value =>{
      var column = value;
      var bookId=column.bookid;
      var bookName=column.bookname;
      var rackNo=column.rackno;
      var sid =column.stdid;
      var sname = column.fname;
      var ddate = column.duedate;
      var idate = column.issuedate;
      res.render("issuedbooks.ejs", {
          bookid: bookId,
          bookname: bookName,
          rackno: rackNo,
          issuedate: getdatetime(idate),
          duedate: getdatetime(ddate),
          studentid: sid,
          studentname: sname,
          issuedcount: issuedCount,
      })
      
  })
});

app.post("/addstaff", (req,res) =>{
  const staffid = req.body["staffid"];
  const sfname = req.body["sfname"];
  const smname = req.body["smname"];
  const slname = req.body["slname"];
  const sdept = req.body["sdept"];
  const staffpass = req.body["staffpass"];

async function addstaff() {
  try{
      console.log("Data base connected");
      await db.query("insert into libstaff (staffid,sfname,smname,slname,sdept,staffpass) values ($1,$2,$3,$4,$5,$6);",[staffid,sfname,smname,slname,sdept,staffpass]);
      console.log("Data inserted succesfully");
  }catch(err){
      console.error("Error in adding libbooks ",err.stack);
  }
}
  addstaff();

  res.render("addstaff.ejs",{
      warn: "Staff added sussesfully!",
  })
});

// libstaff list get request
var staffCount;
app.get("/stafflist", (req, res) => {
  // console.log(req.user);  
    async function fetchstaffdetails() {
      try {
      
          console.log('Connected to the database');
          const res = await db.query('SELECT * FROM libstaff ');
          var issueDCount = await db.query('select count(*) from libstaff');
          staffCount = issueDCount.rows[0].count
          // Extract data column-wise
          const columns = {};
          res.fields.forEach(field => {
              columns[field.name] = [];
          });
  
          res.rows.forEach(row => {
              res.fields.forEach(field => {
                  columns[field.name].push(row[field.name]);
              });
          });
         return columns;
  
      } catch (err) {
          console.error('Error executing query', err.stack);
      } 
  }

  fetchstaffdetails().then(value =>{
      var column = value;
      var staffId=column.staffid;
      var sFname=column.sfname;
      var sLname=column.slname;
      var sDept =column.sdept;
      var staffPass = column.staffpass;
      res.render("stafflist.ejs", {
          staffid: staffId,
          sfname: sFname,
          slname: sLname,
          sdept: sDept,
          staffpass: staffPass,
          staffcount: staffCount,
      })
      
  })
});

app.get("/staffpage",(req,res)=>{
    res.redirect("/staffdetails");
});

app.get("/adminpage",(req,res) =>{
    res.redirect("/admindetails");
});

app.get("/addstaff", (req, res) => {
    res.render("addstaff.ejs");
});

var Adminid;
var adminPass;
app.post("/submit",async (req,res) =>{
  Adminid=req.body["adminid"];
  adminPass=req.body["password"];
  try{
    const data=await db.query("select * from libadmin where adminid=$1",[Adminid]);
   if(Adminid == data.rows[0].adminid  && adminPass == data.rows[0].adminpass)
  {
    return res.redirect("/admindetails");
  }else{
    return res.render("login.ejs",{
      warn: "Please Enter valid details ",
    });
  }
 }catch(err){
   return res.render("login.ejs",{
    warn: "Please Enter valid details",
  });
 }
});
app.get("/admindetails",async (req,res) => {
  const data=await db.query("select * from libadmin where adminid=$1",[Adminid]);
  res.render("adminpage.ejs",{
    adminname: data.rows[0].afname+' '+data.rows[0].alname,
    adminId: Adminid,
  });
});

const columns = {};
var StaffId;
var staffPass;
app.post("/submitstaff",async (req,res) =>{
  StaffId=req.body["username"];
  staffPass=req.body["password"];
  try{
  const data=await db.query("select * from libstaff where staffid=$1",[StaffId]);
  if(StaffId == data.rows[0].staffid  && staffPass == data.rows[0].staffpass)
  {
    return res.redirect("/staffdetails");
  }else{
    return res.render("stafflogin.ejs",{
      warning:"Please Enter valid details",
    });
  }
 }catch(err){
   return res.render("stafflogin.ejs",{
    warning:"Please Enter valid details",
  });
 }
});

app.get("/staffdetails",async (req,res) => {
  try {              
    console.log('Connected to the database');
    const res = await db.query('SELECT * FROM libissuedbooks where duedate<current_date order by duedate asc');
    var issueDCount = await db.query('select count(*) from libbooks where avail=false');
    issuedCount = issueDCount.rows[0].count
    // Extract data column-wise
    res.fields.forEach(field => {
        columns[field.name] = [];
    });

    res.rows.forEach(row => {
        res.fields.forEach(field => {
            columns[field.name].push(row[field.name]);
        });
    });

} catch (err) {
    console.error('Error executing query', err.stack);
}
const data=await db.query("select * from libstaff where staffid=$1",[StaffId]);
  res.render("staffpage.ejs",{
    staffname: data.rows[0].sfname+' '+data.rows[0].slname,
    staffId: StaffId,
    bookid: columns.bookid,
    bookname: columns.bookname,
    rackno: columns.rackno,
    issuedate: getdatetime(columns.issuedate),
    duedate: getdatetime(columns.duedate),
    studentid: columns.stdid,
    studentname: columns.fname,
    issuedcount: issuedCount,
  });
});

app.post("/register", async (req, res) => {
  const adminid = req.body.adminid;
  const password = req.body.password;
  try {
    const checkResult = await db.query("SELECT * FROM libstaff WHERE staffid = $1", [
      adminid,
    ]);
    /*
    if (checkResult.rows.length > 0) {
      req.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/secrets");
          });
        }
    
      });
    }
    */
  } catch (err) {
    console.log(err);
  }
});


// passport.use(
//   new Strategy(async function verify(staffid, password, cb) {
//     try {
//       const result = await db.query("SELECT * FROM libstaff WHERE staffid = $1 ", [
//         staffid,
//       ]);


//       console.log(staffid);
//       console.log(password);
//   if(staffid == 100){
//       app.get("/adminpage", (req, res) => {
//         // console.log(req.user);
//         if (req.isAuthenticated()) {
//           const Name = user().afname;
//           const Id = user().adminid;
//           res.render("adminpage.ejs",{
//             adminname: Name,
//             adminId: Id,
//           });
//         } else {
//           res.redirect("/login");
//         }
//       });

//       return cb(null, user());
//     }

//       //  const user = result.rows[0];
//       user();
//         const storedPassword = user().staffpass;

//         console.log(storedPassword);


//       /*  bcrypt.compare(password, storedPassword, (err, valid) => { */
//           if (password != storedPassword) {
//             //Error with password check
//             console.log("Error comparing passwords:");
//             return cb("The Password does not Match");
//          //   return cb(err);
            
//           }
//             else if (password == storedPassword) {
//               app.get("/staffpage", (req, res) => {
//                 // console.log(req.user);
//                 if (req.isAuthenticated()) {


//                   async function fetchbookdetails() {
//                     try {
                    
//                         console.log('Connected to the database');
//                         const res = await db.query('SELECT * FROM libissuedbooks where duedate<current_date order by duedate asc');
//                         var issueDCount = await db.query('select count(*) from libbooks where avail=false');
//                         issuedCount = issueDCount.rows[0].count
//                         // Extract data column-wise
//                         const columns = {};
//                         res.fields.forEach(field => {
//                             columns[field.name] = [];
//                         });
                
//                         res.rows.forEach(row => {
//                             res.fields.forEach(field => {
//                                 columns[field.name].push(row[field.name]);
//                             });
//                         });
//                        return columns;
                
//                     } catch (err) {
//                         console.error('Error executing query', err.stack);
//                     } 
//                 }
              
//                 fetchbookdetails().then(value =>{
//                     var column = value;
//                     var bookId=column.bookid;
//                     var bookName=column.bookname;
//                     var rackNo=column.rackno;
//                     var sid =column.stdid;
//                     var sname = column.fname;
//                     var ddate = column.duedate;
//                     var idate = column.issuedate;


//                   const Name = user().sfname;
//                   const Id = user().staffid;
//                   res.render("staffpage.ejs",{
//                     staffname: Name,
//                     staffId: Id,


//                     bookid: bookId,
//                     bookname: bookName,
//                     rackno: rackNo,
//                     issuedate: getdatetime(idate),
//                     duedate: getdatetime(ddate),
//                     studentid: sid,
//                     studentname: sname,
//                     issuedcount: issuedCount,
//                   });
//                 })
//                 } else {
//                   res.redirect("/stafflogin");
//                 }
//               });

//               return cb(null, user());
//             } else {
//               //Did not pass password check
//               return cb(null, false);
//             }
//             function user(){
//               const user = result.rows[0];
//               return user;
//             }
//           }catch (err) {
//             console.log(err);
//           }
//      /*   }); */

    
//     } 
//   )
// );




// passport.serializeUser((user, cb) => {
//   cb(null, user);
// });
// passport.deserializeUser((user, cb) => {
//   cb(null, user);
// });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
//


