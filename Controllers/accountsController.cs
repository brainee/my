using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace myctirp.Controllers
{
    public class accountsController : Controller
    {
        //
        // GET: /orders/
        public ActionResult login()
        {
            return View();
        }

        public ActionResult unlogincheck()
        {
            return View();
        }
    }
}
