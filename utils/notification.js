/*
const firebase = require('firebase');
const firebaseAuth = require('firebase/auth');
const firebaseDatabase = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyCE4VIzdAVI7KHWeUG7VHHr6gZcX4_ZYJw",
  authDomain: "Docitoo-d0aae.firebaseapp.com",
  databaseURL: "https://Docitoo-d0aae.firebaseio.com",
  projectId: "Docitoo-d0aae",
  storageBucket: "Docitoo-d0aae.appspot.com",
  messagingSenderId: "1031727909083",
  appId: "1:1031727909083:web:d58d990006a4065b0ea4fe",
  measurementId: "G-JVNWWGVE82"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

const ProjectUserSchema = require('../Models/ProjectUser');
const UserSchema = require('../Models/User');
const UserNotificationSchema = require('../Models/UserNotification');
const asyncHandler = require('../middleware/async');


let sendPushNotificationForAllProjectUsers = asyncHandler(async (userId, title, body, projectId, type, subcategory, notificaitonType, projectNotificationType) => {
  try {
    const projectUsers = await ProjectUserSchema.find({
      project: projectId,
      status: ProjectUserSchema.Status.ACTIVE
    });

    for (let projectUser of projectUsers) {
      sendPushNotification(projectUser.user, title, body, type, subcategory, notificaitonType, projectNotificationType, projectId)
    }

  } catch (error) {
    console.log(error);
  }
});

let sendPushNotification = asyncHandler(async (user, title, body, type, subcategory, notificaitonType, projectNotificationType, projectId) => {
  try {

    /!*let query = new Parse.Query(Parse.Installation);
    query.equalTo("user", user);
    Parse.Push.send({
      where: query,
      data: {
        "type": type,
        "notificaitonType": notificaitonType,
        "projectNotificationType": projectNotificationType,
        "projectId": projectId,
        "category": subcategory
      },
      notification: {
        "title": "Docitoo",
        "body": body,
        "sound": "default",
        "image": "https://Docitoo.s3.us-east-2.amazonaws.com/_Docitoo/logo.png",
      }
    }, {useMasterKey: true}).then(() => {
      console.log("push notificaiton sent successfully");
    }, (error) => {
      console.log("push notificaiton error");
      console.log(error);
    })*!/
  } catch (error) {
    console.log(error.message);
  }
});

let sendNotifications = asyncHandler(async (senderUser, category, subcategory, project, extra) => {
  try {
    const projectUsers = await ProjectUserSchema.find({
      project: project.id,
      status: ProjectUserSchema.Status.ACTIVE
    });

    for (let projectUser of projectUsers) {
      const recipient = await UserSchema.findById(projectUser.user);
      sendSingleNotification(recipient, senderUser, category, subcategory, project, extra)
    }
  } catch (e) {

  }
});

async function sendSingleNotification(recipientUser, senderUser, category, subcategory, project, extra = {}) {
  try {
    const userNotification = await UserNotificationSchema.create({
      category: category,
      subcategory: subcategory,
      read: false
    });

    let emailTemplate = '';
    let tab = '';
    let messageBody = '';
    let messageTitle = '';

    extra.recipient = {
      firstName: recipientUser.firstName,
      lastName: recipientUser.lastName,
      email: recipientUser.username
    };


    if (project) {
      userNotification.project = project.id;
      extra.project = {
        projectName: project.name
      }
    }

    if (senderUser) {
      userNotification.user = senderUser.id;
      extra.sender = {
        firstName: senderUser.firstName,
        lastName: senderUser.lastName,
        email: senderUser.username
      }
    }

    /!*if (extra) {
      if (extra.pointId) {
        userNotification.set("point", Parse.Object.extend("Project_Point").createWithoutData(extra.pointId));
      }
      if (extra.commentId) {
        userNotification.set("comment", Parse.Object.extend("Project_Point_Comment").createWithoutData(extra.commentId));
      }
      if (extra.oldRole) {
        userNotification.set("old_role", extra.oldRole);
      }
      if (extra.newRole) {
        userNotification.set("new_role", extra.newRole);
      }
    }*!/

    switch (subcategory) {
      case 'WELCOME':
        emailTemplate = 'welcomeEmail';
        tab = 'general';
        messageBody = `Welcome to Docitoo ${extra.recipient.firstName} ${extra.recipient.lastName}`;
        messageTitle = "Hello!";
        break;
      case 'WELCOME_BACK':
        emailTemplate = 'welcomeBackEmail';
        tab = 'general';
        messageBody = `Welcome back to Docitoo ${extra.recipient.firstName} ${extra.recipient.lastName}`;
        messageTitle = "Hello, Again!";
        break;
      case 'INVITATION':
        emailTemplate = (extra.type === "GUEST") ? "InviteGuestToProject" : "InviteUserToProject";
        tab = 'general';
        messageBody = `You have received Invitation from ${extra.sender.firstName} ${extra.sender.lastName} to ${extra.project.projectName} project`;
        messageTitle = "Invitation request";
        break;
      case 'INVITATION_ACCEPTED':
        emailTemplate = "";
        tab = 'notification';
        messageBody = `${extra.sender.firstName} ${extra.sender.lastName} accepted your invitation on ${extra.project.projectName} project`;
        messageTitle = "Invitation accepted";
        break;
      case 'INVITATION_REJECTED':
        emailTemplate = "";
        tab = 'notification';
        messageBody = `${extra.sender.firstName} ${extra.sender.lastName} rejected your invitation on ${extra.project.projectName} project`;
        messageTitle = "Invitation rejected";
        break;
      case 'POINT_RESOLVED':
        emailTemplate = 'pointResolved';
        tab = 'comment';
        messageBody = `${extra.sender.firstName} ${extra.sender.lastName} has resolved one point on ${extra.project.projectName} project`;
        messageTitle = "";
        break;
      case 'NEW_COMMENT':
        emailTemplate = 'newComment';
        tab = 'comment';
        messageBody = `${extra.sender.firstName} ${extra.sender.lastName} has new comment on ${extra.project.projectName} project`;
        messageTitle = "";
        break;
      case 'COMMENT_REPLY':
        emailTemplate = "";
        tab = 'comment';
        messageBody = `${extra.sender.firstName} ${extra.sender.lastName} reply on a comment on ${extra.project.projectName} project`;
        messageTitle = "";
        break;
      case 'PROJECT_APPROVED':
        emailTemplate = "";
        tab = 'notification';
        messageBody = `${extra.sender.firstName} ${extra.sender.lastName} approved ${extra.project.projectName} project`;
        messageTitle = "Project approved";
        break;
      case 'ROLE_CHANGED':
        emailTemplate = "";
        tab = 'notification';
        messageBody = `${extra.sender.firstName} ${extra.sender.lastName} updated your role on ${extra.project.projectName} project from ${userNotification.get("old_role")} to ${userNotification.get("new_role")}`;
        messageTitle = "Role changed";
        break;
      case 'PROJECT_ARCHIVED':
        emailTemplate = "";
        tab = 'notification';
        messageBody = `${extra.project.projectName} project has been archived`;
        messageTitle = "Project archived";
        break;
      case 'PROJECT_ACTIVATED':
        emailTemplate = "";
        tab = 'notification';
        messageBody = `${extra.project.projectName} project has been activated`;
        messageTitle = "Project activated";
        break;
      case 'UNASSIGNED':
        emailTemplate = "";
        tab = 'general';
        messageBody = `You have been un-assigned from ${extra.project.projectName} project`;
        messageTitle = "Un-assigned";
        break;
      default:
        break;
    }
    userNotification.tab = tab;

    if (recipientUser) {

      await userNotification.save();

      // increase notificationCount
      if (category === 'PROJECT') {
        let projectUser = await ProjectUserSchema.findOne({
          project: project.id,
          user: recipientUser.id
        });

        projectUser.notificationCount = parseInt(projectUser.notificationCount) + 1;
        projectUser.hasNotifications =  true;
        await projectUser.save();
      }

      recipientUser.notificationCount = parseInt(recipientUser.notificationCount) + 1;
      await recipientUser.save();

      sendEmail(recipientUser.username, emailTemplate, extra);

      sendPushNotification(recipientUser, messageTitle, messageBody, 'notification', subcategory, category, tab, ((project) ? project.id : undefined));
    }

  } catch (e) {
    console.log(e.message)
  }
}


function getUserObject(userObject) {
  return userObject.fetch({useMasterKey: true});
}

module.exports = {
  sendPushNotificationForAllProjectUsers,
  sendSingleNotification,
  sendNotifications
};
*/
