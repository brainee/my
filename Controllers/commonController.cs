using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace myctirp.Controllers
{
    public class commonController : Controller
    {
        //
        // GET: /orders/
        public ActionResult about()
        {
            return View();
        }

        public ActionResult feedback()
        {
            return View();
        }

        public ActionResult agreement()
        {
            return View();
        }

        public ActionResult setting()
        {
            return View();
        }

        public ActionResult noticelist()
        {
            return View();
        }

        public ActionResult noticedetail()
        {
            return View();
        }
    }
}
