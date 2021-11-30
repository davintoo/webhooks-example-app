const express = require('express')
const path = require('path')

const {Sequelize, Model, DataTypes} = require('sequelize');
const PORT = process.env.PORT || 5000

const userId = 12;
const secret = process.env.SECRET;

const config = {
    host: process.env.MYSQL_SERVER || '127.0.0.1',
    port: process.env.MYSQL_PORT || 3306,
    username: process.env.MYSQL_USER || '',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || '',
    dialect: "mysql"
};
console.log('config', config);


const sequelize = new Sequelize(config.database, config.username, config.password, {
    logging: (str, params) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(str, params.bind);
        }
    },
    define: {
        timestamps: false,
        underscored: true,
        freezeTableName: true
    },
    dialect: 'mysql',
    host: config.host,
    port: config.port
});

class UserRating extends Model {
}

UserRating.init({
    user_id: {type: DataTypes.INTEGER(10).UNSIGNED},
    value: {type: DataTypes.FLOAT(10).UNSIGNED},
}, {sequelize, modelName: 'UserRating'});

class Notification extends Model {
}

Notification.init({
    id: {type: DataTypes.INTEGER(10).UNSIGNED, primaryKey: true, autoIncrement: true},
    user_id: {type: DataTypes.INTEGER(10).UNSIGNED},
    subject: {type: DataTypes.TEXT},
    body: {type: DataTypes.TEXT},
    created: {type: DataTypes.DATE},
}, {sequelize, modelName: 'Notification'});

class Task extends Model {
}

Task.init({
    id: {type: DataTypes.INTEGER(10).UNSIGNED, primaryKey: true, autoIncrement: true},
    user_id: {type: DataTypes.INTEGER(10).UNSIGNED},
    task_id: {type: DataTypes.INTEGER(10).UNSIGNED},
    title: {type: DataTypes.TEXT},
    url: {type: DataTypes.TEXT},
    created: {type: DataTypes.DATE},
}, {sequelize, modelName: 'Task'});

(async () => {
    await sequelize.sync();
})();


express()
    .use(express.static(path.join(__dirname, 'public')))
    .use(express.json())
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .post('/api/clear', async (req, res) => {
        const reqSecret = req.body.secret || '';
        if (reqSecret !== secret) {
            res.status(403).json({
                message: 'Permission denied'
            });
            return;
        }

        await UserRating.destroy({
            user_id: userId
        });
        await Task.destroy({
            user_id: userId
        });
        await Notification.destroy({
            user_id: userId
        });

        res.json({OK: true});
    })
    .post('/api/rating', async (req, res) => {
        const reqSecret = req.body.secret || '';
        if (reqSecret !== secret) {
            res.status(403).json({
                message: 'Permission denied'
            });
            return;
        }
        if (req.body.user_id !== userId) {
            res.json({OK: true});//ignore this user
            return;
        }
        let rating = await UserRating.findOne({
            where: {
                user_id: userId
            }
        });
        if (!rating) {
            rating = await UserRating.create({
                user_id: userId
            });
        }

        rating.value = req.body.rating;
        await rating.save()

        res.json({OK: true});
    })
    .post('/api/notifications', async (req, res) => {
        const reqSecret = req.body.secret || '';
        if (reqSecret !== secret) {
            res.status(403).json({
                message: 'Permission denied'
            });
            return;
        }
        if (req.body.user.id !== userId) {
            res.json({OK: true});//ignore this user
            return;
        }
        await Notification.create({
            user_id: userId,
            subject: req.body.subject,
            body: req.body.body,
            created: new Date(),
        });

        res.json({OK: true});
    })
    .post('/api/tasks/assign', async (req, res) => {
        const reqSecret = req.body.secret || '';
        if (reqSecret !== secret) {
            res.status(403).json({
                message: 'Permission denied'
            });
            return;
        }
        if (req.body.user_id !== userId) {
            res.json({OK: true});//ignore this user
            return;
        }
        const task = await Task.findOne({
            where: {
                user_id: userId,
                task_id: req.body.task_id
            }
        });
        if(!task) {
            await Task.create({
                user_id: userId,
                task_id: req.body.task_id,
                title: req.body.title,
                url: req.body.url,
                created: new Date(),
            });
        }

        res.json({OK: true});
    })
    .post('/api/tasks/unassign', async (req, res) => {
        const reqSecret = req.body.secret || '';
        if (reqSecret !== secret) {
            res.status(403).json({
                message: 'Permission denied'
            });
            return;
        }
        if (req.body.user_id !== userId) {
            res.json({OK: true});//ignore this user
            return;
        }
        await Task.destroy({
            user_id: userId,
            task_id: req.body.task_id
        });
        res.json({OK: true});
    })
    .get('/', async (req, res) => {
        const rating = await UserRating.findOne({
            where: {
                user_id: userId
            }
        });
        const notifications = await Notification.findAll({
            where: {
                user_id: userId
            }
        });
        const tasks = await Task.findAll({
            where: {
                user_id: userId
            }
        });
        res.render('pages/index', {
            rating: rating ? rating.value : 0,
            tasks: tasks,
            notifications: notifications,
        })
    })
    .listen(PORT, () => console.log(`Listening on ${PORT}`))
