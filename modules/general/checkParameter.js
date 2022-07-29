module.exports = (args, parameter) => {

    function hasUser(args) {
        return args.length > 0;
    }

    if(parameter == "-i"){
        if (args.includes(parameter)) {
            let index = args.indexOf(parameter);
            args.splice(index, 1);
            let indexval = args.splice(index, 1);
            indexval = parseInt(indexval)-1;
            if (hasUser(args)) {
                return {contains: true, args: args.join('_'), hasUser: true, index: indexval};
            } else {
                return {contains: true, hasUser: false, index: indexval};
            }
        } else {
            return {contains: false, args: args.join('_')};
        }
    } else {
        if (args.includes(parameter)) {
            let index = args.indexOf(parameter);
            args.splice(index, 1);
            if (hasUser(args)) {
                return {contains: true, args: args.join('_'), hasUser: true};
            } else {
                return {contains: true, hasUser: false};
            }
        } else {
            return {contains: false, args: args.join('_')};
        }
    }
}