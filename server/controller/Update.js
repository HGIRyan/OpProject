const moment = require('moment');
const Default = require('./Defaults');
let { sessionCheck } = Default;
const Err = require('./Error');
const cloudinary = require('cloudinary').v2;
const Defaults = require('./Defaults');
const axios = require('axios');
const {
	CLOUDINARY_API_KEY,
	CLOUDINARY_SECRET,
	CLOUDINARY_NAME,
	REACT_APP_SF_SECURITY_TOKEN,
	SF_USERNAME,
	SF_PASSWORD,
	GATHERUP_BEARER_TOKEN,
	GATHERUP_CLIENTID,
} = process.env;
cloudinary.config({
	cloud_name: CLOUDINARY_NAME,
	api_key: CLOUDINARY_API_KEY,
	api_secret: CLOUDINARY_SECRET,
});
var jsforce = require('jsforce');
var conn = new jsforce.Connection();
if (process.env.REACT_APP_VERTICLES === 'false') {
	conn.login(SF_USERNAME, SF_PASSWORD + REACT_APP_SF_SECURITY_TOKEN, function (err, userInfo) {}); //.then(re => console.log(re));
}
module.exports = {
	// DEFAULTS
	reviewEmail: async (req, res) => {
		try {
			let { settings, emails, formData, type } = req.body;
			type = type === 'NA' ? 'ALL' : type;
			let update = async (settings, emails, type) => {
				await req.app.get('db').update.defaults.review_email([type, emails, settings]);
				res.status(200).send({ msg: 'GOOD', settings });
			};
			if (formData.file) {
				console.log('UPLOADING LOGO');
				cloudinary.uploader.upload(formData.file, { width: 200 }, async (err, resp) => {
					if (err) {
						Err.emailMsg(err, 'CLOUDINARY - UPDATE/REVIEWEMAIL');
						res.status(200).send({ msg: 'BAD' });
					} else {
						let link = resp.secure_url;
						settings.logo = link;
						update(settings, emails, type);
					}
				});
			} else {
				update(settings, emails, type);
			}
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/REVIEWEMAIL');
			res.status(200).send({ msg: `BAD: ${e}` });
		}
	},
	reviewEmailAll: async (req, res) => {
		try {
			let { settings, emails, type, newImg } = req.body;
			let db = req.app.get('db').update.defaults;
			await req.app.get('db').update.defaults.review_email([type, emails, settings]);
			let { from_email, auto_amt, email_format, repeat, first, open, positive, s_positive, second, logo, color, frequency } = settings;
			let { fr, or, s, pr, sr, spr } = emails;
			let repe = { repeat: repeat, first, open, positive, s_positive, second };
			auto_amt = Default.auto_amt(auto_amt);
			if (newImg) {
				if (type === 'ALL') {
					// UPDATE OTHER DEFAULTS
					// report_setting
					await db.all_report_settings([from_email]);
					// Settings
					await db.all_settings([auto_amt, email_format, repe, logo, color]);
					// Emails
					// prettier-ignore
					await db.all_review_emails( [
						s.s_subject, Defaults.standardBody(s.s_body), fr.fr_subject, Defaults.firstBody(fr.fr_body), or.or_subject, Defaults.openBody(or.or_body),
						pr.pr_subject, Defaults.positiveBody( pr.pr_body ), sr.sr_subject, Defaults.secondReminder( sr.sr_body ),
						spr.spr_subject, Defaults.secondPositiveReminder( spr.spr_body )
					] );
				} else {
					// report_setting
					await db.type_report_settings([from_email, type]);
					// Settings
					await db.type_settings([auto_amt, email_format, repe, logo, color, type]);
					// Emails
					// prettier-ignore
					await db.type_review_email([
						s.s_subject, Defaults.standardBody(s.s_body), fr.fr_subject, Defaults.firstBody(fr.fr_body), or.or_subject, Defaults.openBody(or.or_body),
						pr.pr_subject, Defaults.positiveBody( pr.pr_body ), sr.sr_subject, Defaults.secondReminder( sr.sr_body ),
						spr.spr_subject, Defaults.secondPositiveReminder( spr.spr_body ), type
					]);
				}
			} else {
				if (type === 'ALL') {
					// UPDATE OTHER DEFAULTS
					// report_setting
					await db.all_report_settings([from_email]);
					// Settings
					await db.all_settings_noimg([auto_amt, email_format, repe]);
					// Emails
					// prettier-ignore
					await db.all_review_emails( [
						s.s_subject, Defaults.standardBody(s.s_body), fr.fr_subject, Defaults.firstBody(fr.fr_body), or.or_subject, Defaults.openBody(or.or_body),
						pr.pr_subject, Defaults.positiveBody( pr.pr_body ), sr.sr_subject, Defaults.secondReminder( sr.sr_body ),
						spr.spr_subject, Defaults.secondPositiveReminder( spr.spr_body )
						]);
				} else {
					// report_setting
					await db.type_report_settings([from_email, type]);
					// Settings
					await db.type_settings_noimg([auto_amt, email_format, repe, type]);
					// Emails
					// prettier-ignore
					await db.type_review_email([
						s.s_subject, Defaults.standardBody(s.s_body), fr.fr_subject, Defaults.firstBody(fr.fr_body), or.or_subject, Defaults.openBody(or.or_body),
						pr.pr_subject, Defaults.positiveBody( pr.pr_body ), sr.sr_subject, Defaults.secondReminder( sr.sr_body ),
						spr.spr_subject, Defaults.secondPositiveReminder( spr.spr_body ), type
					]);
				}
			}
			res.status(200).send({ msg: 'GOOD', settings });
			// if (formData) {
			// 	console.log('UPLOADING LOGO');
			// 	cloudinary.uploader.upload(formData.file, { width: 200 }, async (err, resp) => {
			// 		if (err) {
			// 			Err.emailMsg(err, 'CLOUDINARY - UPDATE/REVIEWEMAIL');
			// 			res.status(200).send({ msg: 'BAD' });
			// 		} else {
			// 			let link = resp.secure_url;
			// 			settings.logo = link;
			// 			update(settings, emails, type);
			// 		}
			// 	});
			// } else {
			// 	update(settings, emails, type);
			// }
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/ALLREVIEWEMAIL');
			res.status(200).send({ msg: `BAD: ${e}` });
		}
	},
	reviewLanding: async (req, res) => {
		try {
			let { type, review_landing } = req.body;
			await req.app.get('db').update.defaults.review_landing([type, review_landing]);
			res.status(200).send({ msg: 'GOOD' });
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/REVIEWLANDING');
			res.status(200).send({ msg: `BAD: ${e}` });
		}
	},
	reviewLandingAll: async (req, res) => {
		try {
			let { type, review_landing } = req.body;
			let { positive, passive, demoter } = review_landing;
			await req.app.get('db').update.defaults.review_landing([type, review_landing]);
			if (type === 'ALL') {
				// UPDATE OTHER DEFAULTS
				await req.app.get('db').update.defaults.all_review_landing([positive, passive, demoter]);
			} else {
				await req.app.get('db').update.defaults.type_review_landing([type, positive, passive, demoter]);
			}
			res.status(200).send({ msg: 'GOOD' });
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/REVIEWLANDING');
			res.status(200).send({ msg: `BAD: ${e}` });
		}
	},
	addonEmail: async (req, res) => {
		try {
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/ADDONEMAIL');
			res.status(200).send({ msg: `BAD: ${e}` });
		}
	},
	addonLanding: async (req, res) => {
		try {
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/ADDONLANDING');
			res.status(200).send({ msg: `BAD: ${e}` });
		}
	},
	indvSettings: async (req, res) => {
		try {
			let { og } = req.body;
			let { from_email, performance_report, feedback_alert, repeat_request, c_id } = og;
			let db = req.app.get('db').update;
			await db.report_setting([c_id, from_email, feedback_alert, performance_report]);
			await db.repeat_request([c_id, repeat_request]);
			og.customers = await Defaults.custCount(req, og);
			let cns = og.customers.reviews[og.customers.reviews.length - 1].remaining;
			let month;
			if (og.reviews.reviews[og.reviews.reviews.length - 4]) {
				let one = og.reviews.reviews[og.reviews.reviews.length - 1].newReviews;
				let two = og.reviews.reviews[og.reviews.reviews.length - 2].newReviews;
				let three = og.reviews.reviews[og.reviews.reviews.length - 3].newReviews;
				let four = og.reviews.reviews[og.reviews.reviews.length - 4].newReviews;
				month = one + two + three + four;
			} else {
				month = 1;
			}
			let auto = await Defaults.setting_auto_amt(cns, month, og);
			if (auto !== 'NA' && !trial && og.auto_amt.amt !== 0) {
				await db.record.auto_amt([og.c_id, { amt: auto }]);
				og.auto_amt = { amt: auto };
			}
			if (req.session.user) {
				req.session.user.info.map((e) => (parseInt(e.c_id) === parseInt(og.c_id) ? (e = og) : null));
			}
			res.status(200).send({ msg: 'GOOD', info: og });
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/indvSettings');
			res.status(200).send({ msg: `BAD: ${e}` });
		}
	},
	deleteCustomer: async (req, res) => {
		try {
			let { selected, og } = req.body;
			await selected.map(async (e) => {
				await req.app.get('db').update.delete_cust([e.c_id, e.id, false]);
			});
			let allCust = await req.app.get('db').info.customers.corp_cust_all([og.cor_id]);
			req.session.user.focus_cust = allCust;
			res.status(200).send({ msg: 'GOOD', cust: allCust });
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/deleteCustomer');
			res.status(200).send({ msg: `BAD: ${e}` });
		}
	},
	indvReviewEmail: async (req, res) => {
		try {
			let db = req.app.get('db').update.review_email;
			// prettier-ignore
			let { s_body, s_subject, or_body, or_subject, pr_body, pr_subject, fr_body, fr_subject,
				email_format, from_email, c_id, sr_body, sr_subject, spr_body, spr_subject, signature }
				= req.body.og;
			// UPDATE review_email
			// -> s_body, s_subject, or_body, or_subject, pr_body, pr_subject, fr_body, fr_subject
			await db.review_email([
				c_id,
				s_body,
				s_subject,
				or_body,
				or_subject,
				pr_body,
				pr_subject,
				fr_body,
				fr_subject,
				sr_body,
				sr_subject,
				spr_body,
				spr_subject,
				signature,
			]);
			// Update Settings
			// -> email_format
			await db.email_format([c_id, email_format]);
			// Update report_setting
			// -> from_email
			await db.from([c_id, from_email]);
			// SET SESSION
			if (req.session.user) {
				req.session.user.info.map((e) => (e = parseInt(e.c_id) === parseInt(c_id) ? req.body.og : e));
			}
			res.status(200).send({ msg: 'GOOD' });
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/indvReviewEmail');
			res.status(200).send({ msg: `BAD: ${e}` });
		}
	},
	gInsights: async (req, res) => {
		try {
			let { calls, direction, website, messages, searches, c_id } = req.body.og;
			await req.app.get('db').update.ginsights([c_id, calls, website, direction, messages, searches]);
			if (req.session.user.info) {
				req.session.user.info.map((e) => (e = parseInt(e.c_id) === parseInt(c_id) ? req.body.og : e));
			}
			res.status(200).send({ msg: 'GOOD' });
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/gInsights');
			res.status(200).send({ msg: `BAD: ${e}` });
		}
	},
	active: async (req, res) => {
		try {
			let { c_id, active } = req.body;
			await req.app.get('db').update.active([c_id, !active]);
			let company = await req.app.get('db').info.specific_business([c_id]);
			if (req.session.user.info && company[0]) {
				req.session.user.info.map((e) => (e = parseInt(e.c_id) === parseInt(c_id) ? company[0] : e));
			}
			res.status(200).send({ msg: 'GOOD', company: company[0] });
		} catch (error) {
			Err.emailMsg(e, 'UPDATE/active');
			res.status(200).send({ msg: `BAD: ${e}` });
		}
	},
	autoAmt: async (req, res) => {
		try {
			let { amt, c_id, cor_id } = req.body;
			// let amt = { amt: parseInt(val) };
			await req.app.get('db').update.auto_amt([c_id, amt]);
			if (req.session.user.info) {
				req.session.user.info.map((e) => (e.auto_amt = parseInt(e.c_id) === parseInt(c_id) ? amt : e.auto_amt));
			}
			res.status(200).send({ msg: 'GOOD', amt, c_id, cor_id });
		} catch (error) {
			Err.emailMsg(error, 'UPDATE/autoAmt');
			res.status(200).send({ msg: `BAD: ${error}` });
		}
	},
	syncSalesForce: async (req, res) => {
		try {
			if (process.env.REACT_APP_SF_SECURITY_TOKEN) {
				let { og } = req.body;
				let { c_api } = req.body.og;
				if (c_api.salesforce.sf_id) {
					let db = req.app.get('db');
					let info = await conn
						.query(
							`
								select asset.name,asset.quantity, account.name, asset.asset_status__c, account.id, account.ownerid, account.status__c,
								account.close_date__c from asset where asset.accountid = '${c_api.salesforce.sf_id}'`,
							function (err, result) {
								if (err) {
									return console.error('This error is in the auth callback: ' + err);
								}
							},
						)
						.then((res) => {
							return res;
						});
					let contact = await conn
						.query(`select contact.name, contact.email from contact where contact.accountid = '${c_api.salesforce.sf_id}'`)
						.then((res) => {
							return res;
						});
					let accountManager;
					let account_status;
					let assets = [];
					// {asset: '', quantity:'', status:''}
					info.records.forEach((el) => {
						let name;
						if (el.Name.includes('inback')) {
							name = 'winback';
						} else if (el.Name.includes('ross')) {
							name = 'cross_sell';
						} else if (el.Name.includes('eview')) {
							name = 'reviews';
						} else if (el.Name.includes('aps')) {
							name = 'maps';
						} else if (el.Name.includes('leadgen')) {
							name = 'leadgen';
						}
						assets.push({ asset: name, quantity: el.Quantity, status: el.Asset_Status__c });
						account_status = el.Account.Status__c;
						accountManager = Defaults.accountManager(el.Account.OwnerId);
						// og.active_prod[name] = el.Asset_Status__c.toLowerCase().includes('active') ? true : false;
					});
					og.c_api.salesforce.contact = contact.records[0];
					og.c_api.salesforce.accountManager = accountManager;
					og.c_api.salesforce.assets = assets;
					let active = account_status.toLowerCase().includes('active') ? true : false;
					// Update Company Table Row
					if (contact.records[0]) {
						// Update Owner Name, Owner Email
						// Update Notification Email
						og.owner_name.first = contact.records[0].Name.split(' ')[0];
						og.owner_name.last = contact.records[0].Name.split(' ').slice(1, 500).join(' ');
						let email = contact.records[0].Email.toLowerCase();
						og.email.email = og.email.email.filter((e) => e.toLowerCase() !== email);
						og.email.email.unshift(email);
						og.feedback_alert.alert = og.feedback_alert.alert.filter((e) => e.to.toLowerCase() !== email);
						og.feedback_alert.alert.unshift({ type: 'all', to: email });
						// Update to DB
						// Update Name and Email
						await db.update.company_name_email([og.c_id, og.owner_name, og.email]);
						// Update Feedback Alert
						await db.update.feedback_alert([og.c_id, og.feedback_alert]);
					}
					await db.update.sf_company_sync([og.c_id, active, og.active_prod, og.c_api]);
					res.status(200).send({ msg: 'GOOD', og });
				} else {
					res.status(200).send({ msg: 'GOOD', og: req.body.og });
				}
			}
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/syncSalesForce');
			res.status(200).send({ msg: `ERROR: ${e}` });
		}
	},
	sfName: async (sf_id) => {
		return await conn
			.query(`select contact.name, contact.email from contact where contact.accountid = '${sf_id}'`, function (err, result) {
				if (err) {
					return console.error('This error is in the auth callback: ' + err);
				}
			})
			.then((res) => {
				res = res.records[0];
				return res;
			});
	},
	syncSF: async (sf_id, c_api) => {
		if (sf_id) {
			let info = await conn
				.query(
					`
							select asset.name,asset.quantity, account.name, asset.asset_status__c, account.id, account.ownerid, account.status__c,
							account.close_date__c from asset where asset.accountid = '${sf_id}'`,
					function (err, result) {
						if (err) {
							return console.error('This error is in the auth callback: ' + err);
						}
					},
				)
				.then((res) => {
					return res;
				});
			let contact = await conn.query(`select contact.name, contact.email from contact where contact.accountid = '${sf_id}'`).then((res) => {
				return res;
			});
			let accountManager;
			let account_status;
			let assets = [];
			info.records.forEach((el) => {
				let name;
				if (el.Name.includes('inback')) {
					name = 'winback';
				} else if (el.Name.includes('ross')) {
					name = 'cross_sell';
				} else if (el.Name.includes('eview')) {
					name = 'reviews';
				} else if (el.Name.includes('aps')) {
					name = 'maps';
				} else if (el.Name.includes('leadgen')) {
					name = 'leadgen';
				}
				assets.push({ asset: name, quantity: el.Quantity, status: el.Asset_Status__c });
				account_status = el.Account.Status__c;
				accountManager = Defaults.accountManager(el.Account.OwnerId);
			});
			c_api.salesforce.contact = contact.records[0];
			c_api.salesforce.accountManager = accountManager;
			c_api.salesforce.assets = assets;
			c_api.salesforce.sf_id = sf_id;
			return c_api;
			// res.status(200).send({ msg: 'GOOD', c_api });
		} else {
			// res.status(200).send({ msg: 'NO ID GIVEN' });
		}
	},
	syncGatherup: async (req, res) => {
		try {
			let today = moment().format('YYYY-MM-DD');
			let db = req.app.get('db');
			let { og } = req.body;
			let { c_api, review_links } = req.body.og;
			var config = {
				headers: { Authorization: 'bearer ' + GATHERUP_BEARER_TOKEN },
			};
			let bodyParams = {
				clientId: GATHERUP_CLIENTID,
				businessId: c_api.gatherup.business_id,
				client: c_api.gatherup.client_id,
				aggregateResponse: 1,
				// page: page,
			};
			let uploadCust = async (cust) => {
				await cust
					// .slice( 0, 1 )
					.forEach(async (cus) => {
						let emailStatus = (info, rat) => {
							switch (info) {
								case '1st reminder sent':
									return 'First Review Reminder';
								case 'Click to review site':
									return 'Clicked';
								case 'Review received':
									return 'Clicked & Left Review';
								case 'Rating received':
									return 'Positive Reminder';
								case 'Request sent':
									return 'First Send';
								case 'Opened - no feedback':
									return 'Open Reminder';
								case '2nd reminder sent':
									return 'Second Reminder';
								case 'Feedback received':
									return 'Feedback';
								default:
									return info;
							}
						};
						// let click = cus.statusInfo === 'Click to review site' || cus.statusInfo === 'Review received' ? true : false;
						let status = emailStatus(cus.statusInfo, cus.rating);
						let active = cus.statusInfo === null ? true : cus.statusInfo.toLowerCase().includes('unsub') || cus.statusInfo === 'Failed to send' ? false : true;
						// Create Customer Row
						// UPDATE FEEDBACK_TEXT
						// await db.update.gather_feedback([cus.id, cus.review ? cus.review : 'N/A']);
						let newId = await db.create.gather_customer([
							og.c_id,
							cus.firstName,
							cus.lastName,
							cus.email,
							cus.phone ? cus.phone : null,
							{ active: [{ type: status, date: today }] },
							active,
							og.cor_id,
							cus.id,
						]);

						// Create Feedback
						if (status !== null || (cus.statusInfo !== 'Customer added' && newId[0])) {
							let history = cus.rating !== null ? { rating: [cus.rating] } : { rating: [] };
							let feed_text = cus.review ? cus.review : 'N/A';
							let rating = cus.rating ? parseInt(cus.rating.split('.')[0]) : null;
							let click = cus.statusInfo === 'Click to review site' || cus.statusInfo === 'Review received' ? true : false;
							let noOpen = ['First Review Reminder', 'First Send', 'Second Reminder'];
							let opened_time = !noOpen.some((e) => e === status) ? '2019-12-05' : null;
							let email_status = noOpen.some((e) => e === status) ? 'delivered' : 'open';
							await db.create.gather_feedback([newId[0].cus_id, feed_text, rating, click, email_status, opened_time, status, history]);
						}
					});
				// console.log(cust.length, cust[0]);
			};
			await axios.post('https://app.gatherup.com/api/customers/get', bodyParams, config).then(async (res) => {
				let pages = res.data.pages;
				if (pages > 1) {
					uploadCust(res.data.data);
					for (let i = 2; i <= pages; i++) {
						setTimeout(async () => {
							bodyParams.page = i;
							await axios.post('https://app.gatherup.com/api/customers/get', bodyParams, config).then(async (resp) => {
								await uploadCust(resp.data.data);
							});
						}, i * 1000);
					}
				} else {
					uploadCust(res.data.data);
				}
				await axios.post('https://app.gatherup.com/api/business/online-review-links/get', bodyParams, config).then(async (resp) => {
					let facebook = '';
					await resp.data.data.map((e) => {
						if (e.socialLinkType === 'facebook') {
							facebook = e.socialLinkUrl;
						}
					});
					if (facebook !== '') {
						review_links.links.push({ site: 'Facebook', link: facebook });
						await db.update.links([og.c_id, review_links]);
					}
				});
			});
			setTimeout(() => {
				res.status(200).send({ msg: 'GOOD' });
			}, 1500);
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/syncGatherup');
			res.status(200).send({ msg: `Error: ${e}` });
		}
	},
	syncInternal: async (req, res) => {
		try {
			let db = req.app.get('db');
			let { og } = req.body;
			let { c_api, c_id } = og;
			// Get Review History
			await axios.get(`http://internal.liftlocal.com/api/migrate/reviews/${c_api.internal}`).then(async (res) => {
				let rev = res.data.reviews;
				await rev
					// .slice( 0, 1 )
					.forEach(async (e) => {
						let info = `${og.company_name} got ${e.ratings} reviews and has a status of ${e.status}`;
						await db.create.review_history([c_id, e.date, e.status, e.ratings, info]);
					});
			});
			// Then
			// Sync Info With Customers
			let gcust = await db.info.customers.corp_cust_all([og.cor_id]);
			await axios.get(`http://internal.liftlocal.com/api/migrate/customers/${c_api.internal}`).then(async (res) => {
				let cust = res.data.customers;
				await gcust.forEach(async (e) => {
					let indv = cust.filter((el) => el.customer_id === e.gather);
					if (indv[0]) {
						// Update Last Sent
						await db.update.gather_last_sent([
							indv[0].customer_id,
							e.activity.active[e.activity.active.length - 1].type === 'Customer added' ? '2005-05-25' : indv[0].date_last_sent,
						]);
						// console.log(indv[0].customer_id, indv[0].date_last_sent);
					}
				});
				// update customer
				// console.log(gcust, cust);
			});
			let obj = { client: c_api.gatherup.client_id, businessId: c_api.gatherup.business_id };
			await axios.post(`http://internal.liftlocal.com/api/cancel`, { obj });
			await Defaults.custCount(req, og);
			res.status(200).send({ msg: 'GOOD' });
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/syncInternal');
			res.status(200).send({ msg: `Error: ${e}` });
		}
	},
	updateLogoLink: async (req, res) => {
		try {
			let { client_id, link, accent } = req.body;
			await req.app.get('db').update.logo_color([client_id, link, accent]);
			res.status(200).send({ msg: 'GOOD' });
		} catch (error) {
			Err.emailMsg(e, 'UPDATE/updateLogoLink');
			res.status(200).send({ msg: `Error: ${e}` });
		}
	},
	updateReviewLandingPage: async (req, res) => {
		try {
			let { passive_landing, positive_landing, demoter_landing, c_id } = req.body.og;
			await req.app.get('db').update.review_landing_page([c_id, passive_landing, positive_landing, demoter_landing]);
			res.status(200).send({ msg: 'GOOD' });
		} catch (e) {
			Err.emailMsg(e, 'UPDATE/updateReviewLandingPage');
			res.status(200).send({ msg: `Error: ${e}` });
		}
	},
	splitList: async (req, res) => {
		try {
			let { cor_id, loc } = req.body;
			let db = req.app.get('db');
			let cust = await db.info.customers.corp_cust_all([parseInt(cor_id)]);
			cust = cust.filter((e) => e.active);
			let chunks = (arr, min, max) => {
				// uncomment this line if you don't want the original array to be affected
				// var arr = arr.slice();
				var arrs = [],
					size = 1;
				var min = min || 1;
				var max = max || min || 1;
				while (arr.length > 0) {
					size = Math.min(max, Math.floor(Math.random() * max + min));
					arrs.push(arr.splice(0, size));
				}
				return arrs;
			};
			// console.log(Math.floor(cust.length / loc.length), cust.length, loc.length);
			let chun = chunks(cust, Math.floor(cust.length / loc.length) - 1, Math.floor(cust.length / loc.length));
			await chun.slice(0, loc.length).map(async (e, i) => {
				let { c_id } = loc[i];
				await e.map(async (el) => {
					await db.update.customer_loc([c_id, el.cus_id]);
				});
			});
			res.status(200).send({ msg: 'GOOD' });
		} catch (error) {
			// Err.emailMsg(error, 'UPDATrror/updateReviewLandingPage');
			res.status(200).send({ msg: `Error: ${error}` });
		}
	},
	gmbLabel: async (req, res) => {
		let { location_id, c_id, label } = req.body.e;
		label = label.toProper();
		await req.app.get('db').update.gmb_label([location_id, c_id, label]);
		res.status(200).send({ msg: 'GOOD' });
	},
};
