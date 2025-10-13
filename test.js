const bcrypt = require('bcryptjs');
(async () => {
    const hash = await bcrypt.hash('test1234', 10);
    console.log(hash); 
})();