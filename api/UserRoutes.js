const router = require('express').Router();
const User = require('../models/User');
var bcrypt = require('bcrypt');
var passport = require('passport');
// router.get('/:id', (req, res) => {
//     User.findById(req.params.id).then(users => {
//         res.status(200).json(users);
//         console.log('Logged in user', users)
//     }).catch(err => {
//         res.status(500).json({ error: err.message })
//     })
// })
// , {
//     method: ‘GET’,
//     headers: {
//       ‘Content-Type’: ‘application/json’
//     }



router.get('', (req, res) => {
    User.find().then(users => {
        res.status(200).json(users);
    }).catch(err => {
        res.status(500).json({
            error: err.message
        })
    })
})



router.post('/register', async(req, res) => {
    if (await userExists(req.body.email)) {
        res.status(409).json({
            error: 'Email already exists'
        })
    } else {
        const newUser = new User({
            email: req.body.email,
            password: User.hashPassword(req.body.password),
            fullname: req.body.fullname,
            service: req.body.service,
            isServiceProvider: req.body.isServiceProvider,
            joindate: req.body.joindate,
            phone: req.body.phone,
            pic:req.body.pic,
            bio:req.body.bio
        })
        await newUser.save().then(user => {
            res.status(201).json(user)
        }).catch((err) => {
            res.status(500).json({
                error: err.message
            })
        })
    }
})

const userExists = async(email) => {
    const user = await User.findOne({
        email: email.toLowerCase().trim()
    })
    if (user) {
        return true;
    } else {
        return false;
    }
}

router.post('/login', (req, res, next) => {
    // passport.authenticate('local', function(err, user, info) {
    //     if (err) { console.log(err); return res.status(501).json(err); }
    //     if (!user) { console.log(info); return res.status(501).json(info); }
    //     req.logIn(user, function(err) {
    //         if (err) { console.log(err); return res.status(501).json(err); }
    //         return res.status(200).json(user)
    //     });
    // })(req, res, next);
    User.findOne({
        email:req.body.email,
    }).then(user=>{
        if(user){
            bcrypt.compare(req.body.password, user.password, function(err, result) {
                if(err){
                    res.status(401).json({
                        error: 'Incorrect Password',
                        msg:"Auth Failed",
                        UserData:'',
                        status:'error'
                    })
                }
                if(result){
                 res.status(200).json({
                     msg:"User Login Successfully",
                     'UserData':user,
                     status:'success'
                    });
                }else{
                    res.status(401).json({
                        error: 'Incorrect Password',
                        msg:"Auth Failed",
                        UserData:'',
                        status:'error'
                    })
                }
             });
        }
        else {
            res.status(401).json({
                error: 'Incorrect email'
            })
        }
    })
    .catch(err=>{
        res.json({
            error:err
        });
        console.log("hello", err)
    })
  
//     User.findOne({
//         email: req.body.email,
//         password: req.body.password
//     }).then(user => {
//         if (user) {
//             res.status(200).json(user)
//         } else {
//             res.status(401).json({
//                 error: 'Incorrect email or password'
//             })
//         }
//     }).catch(err => {
//         res.status(500).json({
//             error: err.message
//         })
//     })
// })
    });
 


router.get('/:id', (req, res) => {
    let id = req.params.id
    User.findOne({
        _id: id
    }).then(user => {
        if (user) {
            res.status(200).json(user)
        } else {
            res.status(401).json({
                error: 'No User Found'
            })
        }
    }).catch(err => {
        res.status(500).json({
            error: err.message
        })
    })
})

router.post('/insert/:id', (req, res) => {
    let id = req.params.id
    const leaves = {
        remainingLeaves: req.body.remainingLeaves,
        totalLeaves: req.body.totalLeaves,
        appliedLeaves: req.body.appliedLeaves
    };
    User.updateOne({
        _id: id
    }, {
        $set: leaves
    }, {
        new: true
    }, function(err, article) {
        if (err) return handleError(err);
        res.send(article);
    });
});

router.put('/updateLeaveStatus/:id', (req, res) => {
    let id = req.params.id;
    User.findOne({
        _id: id
    }, (err, foundedObject) => {
        if (err) {
            console.log(err);
            res.status(500).send();
        } else {
            if (!foundedObject) {
                res.status(404).send();
            } else {
                let leaveArray = [];;
                foundedObject.leaves.map(a => {
                    leaveArray.push(a)
                })
                leaveArray.map(n => {
                    if (n['_id'] == req.body.id) {
                        leaveArray[leaveArray.indexOf(n)].status = req.body.event
                        let to = leaveArray[leaveArray.indexOf(n)].to;
                        let from = leaveArray[leaveArray.indexOf(n)].from;
                        let diff = (to.getDate() - from.getDate()) + 1;
                        if (leaveArray[leaveArray.indexOf(n)].status == "Denied" && req.body.prevStatus !== "Pending") {
                            if (foundedObject.appliedLeaves > 0) {
                                // foundedObject.appliedLeaves = Number(foundedObject.appliedLeaves) - Number(diff);
                                if (foundedObject.remainingLeaves <= 24) {
                                    foundedObject.remainingLeaves = Number(foundedObject.totalLeaves) + Number(diff);
                                    foundedObject.totalLeaves = Number(foundedObject.remainingLeaves)
                                        // foundedObject.appliedLeaves = leaveArray.length
                                }
                            }
                        }
                        if (leaveArray[leaveArray.indexOf(n)].status === "Approved") {
                            // foundedObject.appliedLeaves = Number(foundedObject.appliedLeaves) + Number(diff);
                            foundedObject.remainingLeaves = Number(foundedObject.totalLeaves) - Number(diff);
                            foundedObject.totalLeaves = Number(foundedObject.remainingLeaves)
                                // foundedObject.appliedLeaves = leaveArray.length
                        }
                    }
                })
                foundedObject.save((err, updatedObject) => {
                    if (err) {
                        console.log(err)
                        res.status(500).send();
                    } else {
                        res.send(updatedObject)
                    }
                })
            }
        }
    })
})

router.put('/update/:id', (req, res) => {
    let id = req.params.id;
    User.findOne({
        _id: id
    }, (err, foundedObject) => {
        if (err) {
            console.log(err);
            res.status(500).send();
        } else {
            if (!foundedObject) {
                res.status(404).send();
            } else {
                if (req.body.fullname) {
                    foundedObject.fullname = req.body.fullname;
                }
                if (req.body.email) {
                    foundedObject.email = req.body.email;
                }
                if (req.body.password) {
                    foundedObject.password = User.hashPassword(req.body.password);
                }
                if (req.body.bio) {
                    foundedObject.bio = req.body.bio;
                }
                foundedObject.save((err, updatedObject) => {
                    if (err) {
                        console.log(err)
                        res.status(500).send();
                    } else {
                        res.send(updatedObject)
                    }
                })
            }
        }
    })
})

//check in
router.post("/:id/enter", async(req, res) => {
    try {
        const data = {
            entry: Date.now()
        };
        const user = await User.findOne({
            _id: req.params.id
        });

        //if the user has an attendance array;
        if (user.attendance || user.attendance.length > 0) {
            //for a new checkin attendance, the last checkin
            //must be at least 24hrs less than the new checkin time;

            // const lastCheckInTimestamp = lastCheckIn.date;

            // var ts = Math.round(new Date().getTime() / 1000);
            // var tsYesterday = ts - (24 * 3600);
            // console.log(Date.now(), lastCheckInTimestamp);
            // if(ts<tsYesterday){

            // }
            var lastCheckIn = user.attendance[user.attendance.length - 1];
            if (!lastCheckIn) {
                lastCheckIn = {
                    exit: {
                        exitType: 'Full day',
                        time: new Date()
                    },
                    entry: new Date().setHours(-24, 0, 0, 0),
                    _id: ("616fd18fc902ba3a12893ab4"),
                    date: Date.now()
                }
            }
            if (!lastCheckIn.exit.time) {
                res.send(`Please checkout ${user.fullname}\'s previous check in first`)
                return;
            }
            let nextMidNight = new Date();
            nextMidNight.setHours(24, 0, 0, 0);
            let pastMidNight = new Date();
            pastMidNight.setHours(0, 0, 0, 0);
            // const lastAttendance = user.attendance[user.attendance.length - 1];
            // console.log(lastAttendance.entry<nextMidNight)
            //if (pastMidNight>lastAttendance.entry){}
            // Date.now() > lastCheckInTimestamp
            if (pastMidNight > lastCheckIn.entry) {
                user.attendance.push(data)
                await user.save();
                res.status(200).json(user);

            } else {
                res.send(`${user.fullname} have signed in today already`)
            }
        } else {
            user.attendance.push(data);
            await user.save();
        }

    } catch (error) {
        console.log("something went wrong");
        console.log(error);
    }
});
//check out
router.post("/:id/exit", async(req, res) => {
    // the attendance than can be checked out must be last entry in the attendance array
    try {
        const user = await User.findOne({
            _id: req.params.id
        });

        //check if there is an attendance entry
        if (user.attendance && user.attendance.length > 0) {

            //check whether the exit time of the last element of the attedance entry has a value
            const lastAttendance = user.attendance[user.attendance.length - 1];
            if (lastAttendance.exit.time) {
                res.send(`${user.fullname} has already checked out today`)
                return;
            }

            lastAttendance.exit.time = Date.now();
            lastAttendance.exit.exitType = req.body.exitType;
            await user.save();
            res.status(200).json(user)

        } else { //if no entry
            res.send(`${user.fullname} do not have an attendance entry`)
        }
    } catch (error) {
        console.log('Cannot find User');
    }
});

//leave management

router.post("/:id/apply", async(req, res) => {
    try {
        const data = {
            from: new Date(req.body.from),
            to: new Date(req.body.to),
            reason: req.body.reason,
            status: req.body.status
        };
        const user = await User.findOne({
            _id: req.params.id
        });
        //check if there is an attendance entry

        user.leaves.push(data)
        await user.save();
        res.status(200).json(user);

    } catch (error) {
        console.log('Cannot find User');
    }
});

router.post("/:id/salary", async(req, res) => {
    try {
        const data = {
            month: req.body.month,
            basic: req.body.basic,
            da: req.body.da,
            hra: req.body.hra,
            wa: req.body.wa,
            ca: req.body.ca,
            cca: req.body.cca,
            ma: req.body.ma,
            SalesIncentive: req.body.SalesIncentive,
            LeaveEncashment: req.body.LeaveEncashment,
            HolidayWages: req.body.HolidayWages,
            SpecialAllowance: req.body.SpecialAllowance,
            Bonus: req.body.Bonus,
            IndividualIncentive: req.body.IndividualIncentive,
            pf: req.body.pf,
            esi: req.body.esi,
            tds: req.body.tds,
            lop: req.body.lop,
            pt: req.body.pt,
            SPL_Deduction: req.body.SPL_Deduction,
            ewf: req.body.ewf,
            cd: req.body.cd,
            totalEarning: req.body.totalEarning,
            totalDeductions: req.body.totalDeductions,
            netPay: req.body.netPay,
        };
        const user = await User.findOne({
            _id: req.params.id
        });
        let checkMonth = '';
        // if there is an attendance entry
        user.payroll.map((a) => {
            if (data.month == a.month) {
                checkMonth = "checked";
                res.status(200).json({
                    message: `${this.user.fullname}'s salary slip already created for ${payrolls.month}`
                })
            }
        })
        if (checkMonth !== "checked") {
            user.payroll.push(data)
            await user.save();
            res.status(200).json(user);
        }

    } catch (error) {
        console.log(error)
        res.status(200).json({
            message: error
        })
        console.log('Cannot find User');
    }
});





module.exports = router;


// # HTTPS forced

// <IfModule mod_rewrite.c>

// RewriteEngine On

// RewriteCond %{HTTPS} off
// ErrorDocument 404 /index.html

// RewriteRule ^(.*)$ https://%{SERVER_NAME}%{REQUEST_URI} [R=301,L]
// Header always set Content-Security-Policy "upgrade-insecure-requests;"

// </IfModule>