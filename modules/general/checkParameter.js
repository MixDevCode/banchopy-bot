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
    } else if (parameter == "-?"){
        if (args.includes(parameter)) {
            let index = args.indexOf(parameter);
            args.splice(index, 1);
            let searchval = args.join(' ').match(/(?:"[^"]*"|^[^"]*$)/)[0]
            .replace(/"/g, "");
            let searchval2 = args.join('_').match(/(?:"[^"]*"|^[^"]*$)/)[0]
            if (hasUser(args.join('_').replace(searchval2, ''))) {
                return {contains: true, args: args.join('_').replace(searchval2, '').slice(0, -1), hasUser: true, search: searchval};
            } else {
                return {contains: true, hasUser: false, search: searchval};
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