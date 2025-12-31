class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

   // ================= FILTERING =================
  filter() {
     // 1. Create a shallow copy of query string
    const queryObj = { ...this.queryString };
     // 2. Exclude special query fields for pagination, sorting, limiting, etc.
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);
    // 3. Convert operators like gte, gt, lte, lt to MongoDB format ($gte, $gt, etc.)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
     // 4. Apply filtering to Mongoose query
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }
 // ================= SORTING =================
  sort() {
    if (this.queryString.sort) {
       // Convert comma-separated fields to space-separated for Mongoose
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
       // Default sort by descending creation date
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

   // ================= FIELD LIMITING / PROJECTION =================
  limitFields() {
    if (this.queryString.fields) {
       // Convert comma-separated fields to space-separated for Mongoose select
      const fields = this.queryString.fields.split(',').join('');
      this.query = this.query.select(fields);
    } else {
        // Exclude __v field by default
      this.query = this.query.select('-__v');
    }
    return this;
  }
// ================= PAGINATION =================
  paginate() {
    const page = this.queryString.page * 1 || 1; // Default page = 1
    const limit = this.queryString.limit * 1 || 10; // Default limit = 10
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
