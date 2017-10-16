
class Common {

    static forEachPromise(items, fn) {
        return items.reduce((promise, item) => {
            return promise.then(() => {
                return fn(item);
            });
        }, Promise.resolve());
    }

}

module.exports = Common