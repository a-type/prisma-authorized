export default class UserRoleWeakMap {
  constructor(init) {
    this._wm = new WeakMap(init);
    this.userRoleToBoxType = {};
  }
  getRoleBoxType(user) {
    const userRole = user.role;
    const boxType = this.userRoleToBoxType[userRole] || { role: userRole };
    this.userRoleToBoxType[userRole] = boxType;
    return boxType;
  }

  clear() {
    this._wm = new WeakMap();
  }
  delete(k) {
    return this._wm.delete(this.getRoleBoxType(k));
  }
  get(k) {
    return this._wm.get(this.getRoleBoxType(k));
  }
  has(k) {
    return this._wm.has(this.getRoleBoxType(k));
  }
  set(k, v) {
    this._wm.set(this.getRoleBoxType(k), v);
    return this;
  }
}
